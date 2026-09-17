import { useState, useEffect } from 'react';
import { getCartsItems, createCartItem, updateCartItem, deleteCartItem } from '../api/carts_items';
import { getCarts } from '../api/carts';
import { getServices } from '../api/services';
import { getUsers } from '../api/users';
import AdminNavTabs from './AdminNavTabs';

export default function CartsItemsList() {
  const [items, setItems] = useState([]);
  const [carts, setCarts] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    cart_id: '',
    service_id: '',
    quantity: '1',
  });

  const [editKeys, setEditKeys] = useState(null); // { cartId, serviceId }
  const [formError, setFormError] = useState(null);

  async function loadAllData() {
    try {
      setLoading(true);
      setError(null);
      const [itemsData, cartsData, servicesData, usersData] = await Promise.all([
        getCartsItems(),
        getCarts(),
        getServices(),
        getUsers(),
      ]);
      setItems(itemsData);
      setCarts(cartsData);
      setServices(servicesData);
      setUsers(usersData);
      if (cartsData.length > 0 && servicesData.length > 0 && !formData.cart_id) {
        setFormData({
          cart_id: String(cartsData[0].id_cart),
          service_id: String(servicesData[0].id_service),
          quantity: '1',
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    try {
      if (editKeys) {
        await updateCartItem(editKeys.cartId, editKeys.serviceId, formData);
      } else {
        await createCartItem(formData);
      }
      setFormData({
        cart_id: carts[0] ? String(carts[0].id_cart) : '',
        service_id: services[0] ? String(services[0].id_service) : '',
        quantity: '1',
      });
      setEditKeys(null);
      loadAllData();
    } catch (err) {
      setFormError(err.message);
    }
  }

  function handleEdit(item) {
    setEditKeys({
      cartId: item.cart_id,
      serviceId: item.service_id,
    });
    setFormData({
      cart_id: String(item.cart_id),
      service_id: String(item.service_id),
      quantity: String(item.quantity || '1'),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(cartId, serviceId) {
    if (!window.confirm('Вы уверены, что хотите удалить эту позицию из корзины?')) return;
    try {
      await deleteCartItem(cartId, serviceId);
      loadAllData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancel() {
    setEditKeys(null);
    setFormData({
      cart_id: carts[0] ? String(carts[0].id_cart) : '',
      service_id: services[0] ? String(services[0].id_service) : '',
      quantity: '1',
    });
    setFormError(null);
  }

  return (
    <div className="admin-content-card">
      <AdminNavTabs activeSection="carts-items" />

      <div className="admin-header-row">
        <h2>Позиции в корзинах</h2>
        <span className="count-tag">Всего позиций: {items.length}</span>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <h3>{editKeys ? 'Редактировать количество услуги' : 'Добавить услугу в корзину пользователя'}</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Корзина клиента *</label>
            <select
              name="cart_id"
              value={formData.cart_id}
              onChange={handleChange}
              disabled={Boolean(editKeys)}
              required
            >
              {carts.map((c) => {
                const user = users.find((u) => String(u.id_user) === String(c.user_id));
                return (
                  <option key={c.id_cart} value={c.id_cart}>
                    Корзина: {user ? `${user.second_name} ${user.first_name} (${user.email})` : c.email || 'Пользователь'}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label>Услуга *</label>
            <select
              name="service_id"
              value={formData.service_id}
              onChange={handleChange}
              disabled={Boolean(editKeys)}
              required
            >
              {services.map((s) => (
                <option key={s.id_service} value={s.id_service}>
                  {s.title} ({s.price} ₽)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Количество *</label>
            <input
              type="number"
              name="quantity"
              min="1"
              max="20"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn-primary">
            {editKeys ? 'Сохранить изменения' : 'Добавить в корзину'}
          </button>
          {editKeys && (
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Отмена
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="loading-state">
          <p>Загрузка элементов корзин...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Владелец корзины</th>
                <th>Услуга</th>
                <th>Стоимость за ед.</th>
                <th>Кол-во</th>
                <th>Итого</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, index) => {
                const cartObj = carts.find((c) => String(c.id_cart) === String(it.cart_id));
                const userObj = users.find((u) => String(u.id_user) === String(cartObj?.user_id));
                const servObj = services.find((s) => String(s.id_service) === String(it.service_id));
                const unitPrice = parseFloat(it.price || servObj?.price || 0);
                const total = unitPrice * (parseInt(it.quantity, 10) || 1);

                return (
                  <tr key={`${it.cart_id}-${it.service_id}`}>
                    <td className="row-number-cell">{index + 1}</td>
                    <td>
                      <strong>
                        {it.first_name
                          ? `${it.second_name || ''} ${it.first_name}`
                          : userObj
                          ? `${userObj.second_name} ${userObj.first_name}`
                          : it.email || 'Клиент'}
                      </strong>
                    </td>
                    <td>{it.service_title || servObj?.title || 'Услуга'}</td>
                    <td>{unitPrice.toLocaleString()} ₽</td>
                    <td>
                      <span className="badge-duration">{it.quantity} шт.</span>
                    </td>
                    <td>
                      <strong>{total.toLocaleString()} ₽</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => handleEdit(it)}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className="btn-action-delete"
                        onClick={() => handleDelete(it.cart_id, it.service_id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
