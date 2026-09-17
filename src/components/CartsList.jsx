import { useState, useEffect } from 'react';
import { getCarts, createCart, updateCart, deleteCart } from '../api/carts';
import { getUsers } from '../api/users';
import AdminNavTabs from './AdminNavTabs';

export default function CartsList() {
  const [carts, setCarts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    id_cart: '',
    user_id: '',
  });

  const [formError, setFormError] = useState(null);

  async function loadAllData() {
    try {
      setLoading(true);
      setError(null);
      const [cartsData, usersData] = await Promise.all([
        getCarts(),
        getUsers(),
      ]);
      setCarts(cartsData);
      setUsers(usersData);
      if (usersData.length > 0 && !formData.user_id) {
        setFormData((prev) => ({
          ...prev,
          user_id: String(usersData[0].id_user),
        }));
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
      if (formData.id_cart) {
        await updateCart(formData.id_cart, formData);
      } else {
        await createCart(formData);
      }
      setFormData({
        id_cart: '',
        user_id: users[0] ? String(users[0].id_user) : '',
      });
      loadAllData();
    } catch (err) {
      setFormError(err.message);
    }
  }

  function handleEdit(cart) {
    setFormData({
      id_cart: cart.id_cart,
      user_id: String(cart.user_id),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm('Вы уверены, что хотите удалить эту корзину?')) return;
    try {
      await deleteCart(id);
      loadAllData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancel() {
    setFormData({
      id_cart: '',
      user_id: users[0] ? String(users[0].id_user) : '',
    });
    setFormError(null);
  }

  return (
    <div className="admin-content-card">
      <AdminNavTabs activeSection="carts" />

      <div className="admin-header-row">
        <h2>Пользовательские корзины</h2>
        <span className="count-tag">Всего корзин: {carts.length}</span>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <h3>{formData.id_cart ? 'Сменить владельца корзины' : 'Создать корзину для пользователя'}</h3>

        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="form-group">
            <label>Пользователь (Клиент) *</label>
            <select
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              required
            >
              {users.map((u) => (
                <option key={u.id_user} value={u.id_user}>
                  {u.second_name} {u.first_name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn-primary">
            {formData.id_cart ? 'Сохранить изменения' : 'Создать корзину'}
          </button>
          {formData.id_cart && (
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Отмена
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="loading-state">
          <p>Загрузка корзин...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Владелец корзины</th>
                <th>Email пользователя</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {carts.map((c, index) => {
                const userObj = users.find((u) => String(u.id_user) === String(c.user_id));
                return (
                  <tr key={c.id_cart}>
                    <td className="row-number-cell">{index + 1}</td>
                    <td>
                      <strong>
                        {c.first_name
                          ? `${c.second_name || ''} ${c.first_name}`
                          : userObj
                          ? `${userObj.second_name} ${userObj.first_name}`
                          : 'Пользователь'}
                      </strong>
                    </td>
                    <td>{c.email || userObj?.email || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => handleEdit(c)}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className="btn-action-delete"
                        onClick={() => handleDelete(c.id_cart)}
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
