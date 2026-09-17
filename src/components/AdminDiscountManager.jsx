import { useState, useEffect } from 'react';
import { getServices } from '../api/services';
import { getUsers } from '../api/users';
import { getDiscounts } from '../api/discounts';
import { getСategories, createCategory, deleteCategory } from '../api/categories';
import { getAppointments } from '../api/appointments';
import { getPayments } from '../api/payments';
import { useAuth } from '../context/AuthContext';

export default function AdminDiscountManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('user-discounts'); // 'user-discounts', 'service-discounts', 'categories', 'orders'

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
            Управление персональными скидками пользователей, скидками на товары, категориями и заказами
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
          className={`admin-nav-tab ${activeTab === 'user-discounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('user-discounts')}
        >
          Персональные скидки пользователей ({users.length})
        </button>
        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'service-discounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('service-discounts')}
        >
          Скидки на услуги и товары ({services.length})
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
          {/* 1. USER DISCOUNTS */}
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
                  {users.map((u) => {
                    const currentDisc = discounts.find(d => Number(d.id_discount) === Number(u.discount_id));
                    return (
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. SERVICE DISCOUNTS */}
          {activeTab === 'service-discounts' && (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название услуги</th>
                    <th>Длительность</th>
                    <th>Базовая цена</th>
                    <th>Общая скидка на товар</th>
                    <th>Итоговая цена</th>
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
                      </tr>
                    );
                  })}
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
