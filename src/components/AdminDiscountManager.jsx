import { useState, useEffect } from 'react';
import { getServices, createService, deleteService } from '../api/services';
import { getUsers } from '../api/users';
import { getDiscounts } from '../api/discounts';
import { getСategories, createCategory, deleteCategory } from '../api/categories';
import { getAppointments } from '../api/appointments';
import { getPayments } from '../api/payments';
import { useAuth } from '../context/AuthContext';

export default function AdminDiscountManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('services'); // 'services', 'user-discounts', 'categories', 'orders'

  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // New Category Form
  const [newCatTitle, setNewCatTitle] = useState('');

  // New Service Form
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    duration: 45,
    price: '',
    category_id: '',
    discount_id: 1,
    image_url: '',
  });
  const [creatingService, setCreatingService] = useState(false);

  const isStaffOrAdmin = user && (user.role_id === 1 || user.role_id === 2 || user.role_title === 'Главный администратор' || user.role_title?.includes('Сотрудник'));

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [uData, sData, dData, cData, aData, pData] = await Promise.all([
        getUsers(),
        getServices(),
        getDiscounts(),
        getСategories(),
        getAppointments(),
        getPayments(),
      ]);
      setUsers(uData);
      setServices(sData);
      setDiscounts(dData);
      setCategories(cData);
      setAppointments(aData);
      setPayments(pData);

      if (cData.length > 0 && !newService.category_id) {
        setNewService(prev => ({ ...prev, category_id: String(cData[0].id_category) }));
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки данных администрирования');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleUpdateUserDiscount = async (userId, discountId) => {
    try {
      setError(null);
      const res = await fetch(`http://localhost:3001/api/users/${userId}/discount`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount_id: Number(discountId) }),
      });
      if (!res.ok) throw new Error('Не удалось обновить скидку пользователя');
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id_user === updated.id_user ? { ...u, ...updated } : u));
      setSuccessMsg(`Персональная скидка для ${updated.first_name} ${updated.second_name} успешно обновлена`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateServiceDiscount = async (serviceId, discountId) => {
    try {
      setError(null);
      const res = await fetch(`http://localhost:3001/api/services/${serviceId}/discount`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount_id: Number(discountId) }),
      });
      if (!res.ok) throw new Error('Не удалось обновить скидку на услугу');
      const updated = await res.json();
      setServices(prev => prev.map(s => s.id_service === updated.id_service ? { ...s, ...updated } : s));
      setSuccessMsg(`Скидка на услугу «${updated.title}» успешно обновлена`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;
    try {
      const created = await createCategory({ title: newCatTitle.trim() });
      setCategories(prev => [...prev, created]);
      setNewCatTitle('');
      setSuccessMsg(`Категория «${created.title}» добавлена и сразу видна в каталоге (aside)!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту категорию?')) return;
    try {
      await deleteCategory(catId);
      setCategories(prev => prev.filter(c => c.id_category !== catId));
      setSuccessMsg('Категория успешно удалена');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!newService.title.trim() || !newService.price) {
      setError('Укажите название и стоимость услуги');
      return;
    }
    setCreatingService(true);
    setError(null);
    try {
      const created = await createService({
        title: newService.title.trim(),
        description: newService.description.trim(),
        duration: parseInt(newService.duration, 10) || 30,
        price: parseFloat(newService.price) || 0,
        discount_id: Number(newService.discount_id) || 1,
        category_id: newService.category_id ? Number(newService.category_id) : (categories[0]?.id_category || null),
        image_url: newService.image_url.trim() || null,
      });

      setServices(prev => [...prev, created]);
      setNewService({
        title: '',
        description: '',
        duration: 45,
        price: '',
        category_id: categories[0]?.id_category ? String(categories[0].id_category) : '',
        discount_id: 1,
        image_url: '',
      });
      setSuccessMsg(`Услуга «${created.title}» успешно добавлена в каталог!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Ошибка добавления услуги');
    } finally {
      setCreatingService(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Удалить эту услугу из каталога?')) return;
    try {
      await deleteService(serviceId);
      setServices(prev => prev.filter(s => s.id_service !== serviceId));
      setSuccessMsg('Услуга удалена из каталога');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isStaffOrAdmin) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Доступ ограничен</h2>
        <p style={{ color: 'var(--text-muted)' }}>Этот раздел предназначен только для администраторов и сотрудников.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Панель управления магазином</h1>
          <p className="page-subtitle">
            Добавление и управление услугами, скидками на товары, персональными купонами и категориями
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-success)', color: 'var(--accent-success)', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="admin-nav-bar" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Услуги и добавление ({services.length})
        </button>
        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'user-discounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('user-discounts')}
        >
          Персональные скидки пользователей ({users.length})
        </button>
        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Категории ({categories.length})
        </button>
        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Заказы и платежи ({appointments.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Загрузка данных...</p>
        </div>
      ) : (
        <>
          {/* 1. SERVICES MANAGEMENT & ADDING */}
          {activeTab === 'services' && (
            <div>
              {/* Form to Add New Service */}
              <div className="admin-form" style={{ marginBottom: '2rem' }}>
                <h3>+ Добавить новую услугу в каталог</h3>
                <form onSubmit={handleCreateService}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Название услуги *</label>
                      <input
                        type="text"
                        placeholder="Например: Стрижка бороды и усов"
                        value={newService.title}
                        onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Категория *</label>
                      <select
                        value={newService.category_id}
                        onChange={(e) => setNewService({ ...newService, category_id: e.target.value })}
                        required
                      >
                        {categories.map((c) => (
                          <option key={c.id_category} value={c.id_category}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Базовая цена (₽) *</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        placeholder="1500"
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Длительность (мин.)</label>
                      <input
                        type="number"
                        min="5"
                        max="360"
                        step="5"
                        value={newService.duration}
                        onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Скидка на товар</label>
                      <select
                        value={newService.discount_id}
                        onChange={(e) => setNewService({ ...newService, discount_id: Number(e.target.value) })}
                      >
                        {discounts.map((d) => (
                          <option key={d.id_discount} value={d.id_discount}>
                            {d.title} ({d.percentage}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Ссылка на фото (URL)</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={newService.image_url}
                        onChange={(e) => setNewService({ ...newService, image_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Описание услуги</label>
                    <textarea
                      rows="2"
                      placeholder="Краткое описание процедуры и преимуществ..."
                      value={newService.description}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '4px' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creatingService || !newService.title.trim() || !newService.price}
                  >
                    {creatingService ? 'Добавление...' : 'Создать услугу'}
                  </button>
                </form>
              </div>

              {/* Existing Services List */}
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Название услуги</th>
                      <th>Длительность</th>
                      <th>Базовая цена</th>
                      <th>Скидка на товар</th>
                      <th>Итоговая цена</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => {
                      const disc = discounts.find(d => Number(d.id_discount) === Number(s.discount_id));
                      const pct = disc ? disc.percentage : 0;
                      const finalPrice = pct > 0 ? Math.round(parseFloat(s.price) * (1 - pct / 100)) : parseFloat(s.price);

                      return (
                        <tr key={s.id_service}>
                          <td className="row-number-cell">{s.id_service}</td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{s.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.description || '—'}</div>
                          </td>
                          <td>{s.duration || 30} мин.</td>
                          <td>{parseFloat(s.price).toLocaleString()} ₽</td>
                          <td>
                            <select
                              value={s.discount_id || 1}
                              onChange={(e) => handleUpdateServiceDiscount(s.id_service, e.target.value)}
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                            >
                              {discounts.map((d) => (
                                <option key={d.id_discount} value={d.id_discount}>
                                  {d.title} ({d.percentage}%)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <strong style={{ color: pct > 0 ? 'var(--accent-warning)' : 'var(--text-main)' }}>
                              {finalPrice.toLocaleString()} ₽
                            </strong>
                            {pct > 0 && <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>-{pct}%</span>}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteService(s.id_service)}
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
            </div>
          )}

          {/* 2. USER DISCOUNTS */}
          {activeTab === 'user-discounts' && (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Пользователь</th>
                    <th>Email / Телефон</th>
                    <th>Роль</th>
                    <th>Персональный купон со скидкой</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id_user}>
                      <td className="row-number-cell">{u.id_user}</td>
                      <td>
                        <strong>{u.second_name} {u.first_name} {u.middle_name || ''}</strong>
                      </td>
                      <td>
                        <div>{u.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.phone || '—'}</div>
                      </td>
                      <td>
                        <span className={`badge ${u.role_id === 1 ? 'badge-primary' : 'badge-secondary'}`}>
                          {u.role_title || (u.role_id === 1 ? 'Администратор' : 'Клиент')}
                        </span>
                      </td>
                      <td>
                        <select
                          value={u.discount_id || 1}
                          onChange={(e) => handleUpdateUserDiscount(u.id_user, e.target.value)}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                        >
                          {discounts.map((d) => (
                            <option key={d.id_discount} value={d.id_discount}>
                              {d.title} ({d.percentage}%)
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div>
              <div className="admin-form" style={{ marginBottom: '1.5rem' }}>
                <h3>Добавить новую категорию</h3>
                <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Название новой категории (например: Спа-процедуры, Макияж)..."
                    value={newCatTitle}
                    onChange={(e) => setNewCatTitle(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={!newCatTitle.trim()}>
                    Создать категорию
                  </button>
                </form>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Название категории</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id_category}>
                        <td className="row-number-cell">{c.id_category}</td>
                        <td><strong>{c.title}</strong></td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteCategory(c.id_category)}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. ORDERS & PAYMENTS */}
          {activeTab === 'orders' && (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>№ Заказа</th>
                    <th>Клиент</th>
                    <th>Дата и время</th>
                    <th>Адрес доставки / визита</th>
                    <th>Сумма платежа</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Заказов пока нет</td>
                    </tr>
                  ) : (
                    appointments.map((a) => {
                      const payment = payments.find(p => Number(p.appointment_id) === Number(a.id_appointment));
                      const dateStr = a.appointment_date ? new Date(a.appointment_date).toLocaleString('ru-RU') : '—';
                      return (
                        <tr key={a.id_appointment}>
                          <td className="row-number-cell">{a.id_appointment}</td>
                          <td>
                            <div>{a.first_name} {a.second_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.user_email || a.email}</div>
                          </td>
                          <td>{dateStr}</td>
                          <td>{a.address || 'В салоне'}</td>
                          <td>
                            <strong>{payment ? `${parseFloat(payment.total).toLocaleString()} ₽` : '—'}</strong>
                          </td>
                          <td>
                            <span className="badge badge-success">Оплачен</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
