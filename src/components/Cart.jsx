import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getUsers } from '../api/users';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { user } = useAuth();
  const { cart, loading, error, updateQuantity, removeFromCart, clearCart, reloadCart } = useCart();
  const [masters, setMasters] = useState([]);
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('11:30');
  const [address, setAddress] = useState(user?.address || '');
  const [note, setNote] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const timeSlots = ['09:00', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30'];

  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
    }
  }, [user]);

  useEffect(() => {
    async function loadMasters() {
      try {
        const users = await getUsers();
        const staff = users.filter((u) => u.role_id === 3 || u.role_title === 'Мастер');
        setMasters(staff);
        if (staff.length > 0) {
          setSelectedMasterId(String(staff[0].id_user));
        }
      } catch (err) {
        console.error('Error loading masters:', err);
      }
    }
    loadMasters();
  }, []);

  const userDiscountPercentage = user?.discount_percentage || 0;

  const summary = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        const qty = parseInt(item.quantity, 10) || 1;
        const basePrice = parseFloat(item.price) || 0;
        const duration = parseInt(item.duration, 10) || 30;
        const servPct = item.discount_percentage ? Number(item.discount_percentage) : 0;
        const userPct = Number(userDiscountPercentage);
        const effectivePct = Math.min(75, servPct + userPct);

        const discountedUnitPrice = effectivePct > 0
          ? Math.round(basePrice * (1 - effectivePct / 100))
          : basePrice;

        const itemBaseTotal = basePrice * qty;
        const itemFinalTotal = discountedUnitPrice * qty;
        const itemSavings = itemBaseTotal - itemFinalTotal;

        acc.totalQuantity += qty;
        acc.totalDuration += duration * qty;
        acc.baseTotal += itemBaseTotal;
        acc.finalTotal += itemFinalTotal;
        acc.totalSavings += itemSavings;

        return acc;
      },
      { totalQuantity: 0, totalDuration: 0, baseTotal: 0, finalTotal: 0, totalSavings: 0 }
    );
  }, [cart, userDiscountPercentage]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!user) {
      setCheckoutError('Необходима авторизация для оформления заказа');
      return;
    }
    if (!selectedMasterId) {
      setCheckoutError('Пожалуйста, выберите специалиста');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate < todayStr) {
      setCheckoutError('Дата не может быть меньше текущей даты');
      return;
    }

    setSubmitting(true);
    setCheckoutError(null);

    try {
      const appDateTime = `${selectedDate}T${selectedSlot}:00`;

      const appRes = await fetch('http://localhost:3001/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id_user,
          master_id: parseInt(selectedMasterId, 10),
          appointment_date: appDateTime,
          note: note || `Заказ из корзины (${summary.totalQuantity} услуг)`,
          address: address.trim() || 'Салон (по умолчанию)',
          is_completed: false,
        }),
      });

      if (!appRes.ok) throw new Error('Ошибка при оформлении заказа');
      const newApp = await appRes.json();

      for (const item of cart) {
        await fetch('http://localhost:3001/api/appointments_services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointment_id: newApp.id_appointment,
            service_id: item.service_id,
            quantity: parseInt(item.quantity, 10) || 1,
          }),
        });
      }

      const chosenMaster = masters.find((m) => String(m.id_user) === String(selectedMasterId));
      setCheckoutSuccess({
        id: newApp.id_appointment,
        date: selectedDate,
        time: selectedSlot,
        address: address.trim() || 'Салон (по умолчанию)',
        masterName: chosenMaster ? `${chosenMaster.first_name} ${chosenMaster.second_name || ''}` : 'Мастер',
        total: summary.finalTotal,
        totalDuration: summary.totalDuration,
        count: summary.totalQuantity,
      });

      await clearCart();
    } catch (err) {
      setCheckoutError(err.message || 'Произошла ошибка при оформлении заказа');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Загрузка корзины...</p>
      </div>
    );
  }

  if (checkoutSuccess) {
    return (
      <div className="page-container">
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '2rem', textAlign: 'center' }}>
          <div className="badge badge-success" style={{ marginBottom: '1rem', display: 'inline-block' }}>Заказ успешно оформлен</div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Вы записаны на визит</h2>
          <div style={{ textAlign: 'left', background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <p style={{ marginBottom: '0.4rem' }}>Дата и время: <strong>{checkoutSuccess.date}, {checkoutSuccess.time}</strong></p>
            <p style={{ marginBottom: '0.4rem' }}>Мастер: <strong>{checkoutSuccess.masterName}</strong></p>
            <p style={{ marginBottom: '0.4rem' }}>Адрес: <strong>{checkoutSuccess.address}</strong></p>
            <p style={{ marginBottom: '0.4rem' }}>Общая длительность: <strong>{checkoutSuccess.totalDuration} мин.</strong></p>
            <p style={{ marginBottom: '0' }}>Итоговая сумма: <strong>{checkoutSuccess.total.toLocaleString()} ₽</strong></p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <Link to="/profile" className="btn btn-primary">
              История заказов в кабинете
            </Link>
            <Link to="/available-services" className="btn btn-secondary">
              В каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Корзина и запись</h1>
          <p className="page-subtitle">Выбранные услуги и выбор времени визита</p>
        </div>
        {cart.length > 0 && (
          <button type="button" onClick={clearCart} className="btn btn-danger btn-sm">
            Очистить корзину
          </button>
        )}
      </div>

      {checkoutError && (
        <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }}>
          {checkoutError}
        </div>
      )}

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Ваша корзина пуста</p>
          <Link to="/available-services" className="btn btn-primary">
            Выбрать услуги в каталоге
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
          {/* Items List */}
          <div className="table-wrapper">
            <table className="minimal-table">
              <thead>
                <tr>
                  <th>Услуга</th>
                  <th>Время</th>
                  <th>Цена</th>
                  <th>Кол-во</th>
                  <th>Сумма</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const basePrice = parseFloat(item.price) || 0;
                  const servPct = item.discount_percentage ? Number(item.discount_percentage) : 0;
                  const effectivePct = Math.min(75, servPct + Number(userDiscountPercentage));
                  const finalUnitPrice = effectivePct > 0 ? Math.round(basePrice * (1 - effectivePct / 100)) : basePrice;
                  const itemTotal = finalUnitPrice * item.quantity;
                  const serviceId = item.service_id;

                  return (
                    <tr key={serviceId}>
                      <td>
                        <strong>{item.title || item.service_title}</strong>
                        {effectivePct > 0 && <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>-{effectivePct}%</span>}
                      </td>
                      <td>{item.duration || 30} мин.</td>
                      <td>{finalUnitPrice} ₽</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.1rem 0.4rem', minWidth: '24px' }}
                            onClick={() => updateQuantity(serviceId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.1rem 0.4rem', minWidth: '24px' }}
                            onClick={() => updateQuantity(serviceId, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td><strong>{itemTotal.toLocaleString()} ₽</strong></td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.2rem 0.4rem' }}
                          onClick={() => removeFromCart(serviceId)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Booking Side Form */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              Параметры визита
            </h3>

            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label className="form-label">Специалист</label>
                <select
                  value={selectedMasterId}
                  onChange={(e) => setSelectedMasterId(e.target.value)}
                  required
                >
                  {masters.map((m) => (
                    <option key={m.id_user} value={m.id_user}>
                      {m.first_name} {m.second_name || ''} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Дата</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Время</label>
                <div className="slots-grid">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-pill ${selectedSlot === slot ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Адрес доставки / выезда</label>
                <input
                  type="text"
                  placeholder="г. Москва, ул. Ленина, д. 10 или 'Салон'"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Пожелания к визиту</label>
                <input
                  type="text"
                  placeholder="Дополнительные пожелания..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: '4px', margin: '1rem 0', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Услуг в заказе:</span>
                  <span>{summary.totalQuantity} шт.</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Длительность:</span>
                  <span>{summary.totalDuration} мин.</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <span>К оплате:</span>
                  <span>{summary.finalTotal.toLocaleString()} ₽</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={submitting}
              >
                {submitting ? 'Оформление...' : 'Записаться'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}