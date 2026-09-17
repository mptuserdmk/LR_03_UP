import { useState, useEffect } from 'react';
import { getPayments, createPayment, updatePayment, deletePayment } from '../api/payments';
import { getAppointments } from '../api/appointments';
import { getUsers } from '../api/users';
import AdminNavTabs from './AdminNavTabs';

export default function PaymentsList() {
  const [payments, setPayments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    id_payment: '',
    appointment_id: '',
    payment_date: '',
    total: '',
  });

  const [formError, setFormError] = useState(null);

  async function loadAllData() {
    try {
      setLoading(true);
      setError(null);
      const [payData, appData, usersData] = await Promise.all([
        getPayments(),
        getAppointments(),
        getUsers(),
      ]);
      setPayments(payData);
      setAppointments(appData);
      setUsers(usersData);
      if (appData.length > 0 && !formData.appointment_id) {
        setFormData((prev) => ({
          ...prev,
          appointment_id: String(appData[0].id_appointment),
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
      if (formData.id_payment) {
        await updatePayment(formData.id_payment, formData);
      } else {
        await createPayment(formData);
      }
      setFormData({
        id_payment: '',
        appointment_id: appointments[0] ? String(appointments[0].id_appointment) : '',
        payment_date: '',
        total: '',
      });
      loadAllData();
    } catch (err) {
      setFormError(err.message);
    }
  }

  function handleEdit(item) {
    let formattedDate = '';
    if (item.payment_date) {
      const d = new Date(item.payment_date);
      formattedDate = d.toISOString().slice(0, 16);
    }

    setFormData({
      id_payment: item.id_payment,
      appointment_id: String(item.appointment_id),
      payment_date: formattedDate,
      total: String(item.total || ''),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm('Вы уверены, что хотите удалить этот платеж?')) return;
    try {
      await deletePayment(id);
      loadAllData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancel() {
    setFormData({
      id_payment: '',
      appointment_id: appointments[0] ? String(appointments[0].id_appointment) : '',
      payment_date: '',
      total: '',
    });
    setFormError(null);
  }

  return (
    <div className="admin-content-card">
      <AdminNavTabs activeSection="payments" />

      <div className="admin-header-row">
        <h2>Финансовые операции и платежи</h2>
        <span className="count-tag">Всего платежей: {payments.length}</span>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <h3>{formData.id_payment ? 'Редактировать платеж' : 'Зарегистрировать платеж'}</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Запись клиента *</label>
            <select
              name="appointment_id"
              value={formData.appointment_id}
              onChange={handleChange}
              required
            >
              {appointments.map((a) => {
                const client = users.find((u) => String(u.id_user) === String(a.user_id));
                const dateStr = a.appointment_date
                  ? new Date(a.appointment_date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—';
                return (
                  <option key={a.id_appointment} value={a.id_appointment}>
                    Запись: {client ? `${client.second_name} ${client.first_name}` : a.client_email || 'Клиент'} ({dateStr})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label>Сумма платежа (₽) *</label>
            <input
              type="number"
              name="total"
              step="0.01"
              min="0"
              placeholder="1500"
              value={formData.total}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Дата и время оплаты</label>
            <input
              type="datetime-local"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn-primary">
            {formData.id_payment ? 'Сохранить изменения' : 'Зарегистрировать платеж'}
          </button>
          {formData.id_payment && (
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Отмена
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="loading-state">
          <p>Загрузка платежей...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Клиент</th>
                <th>Дата визита</th>
                <th>Дата и время оплаты</th>
                <th>Сумма</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, index) => {
                const appObj = appointments.find((a) => String(a.id_appointment) === String(p.appointment_id));
                const clientObj = users.find((u) => String(u.id_user) === String(appObj?.user_id));

                const payDateStr = p.payment_date
                  ? new Date(p.payment_date).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—';

                const appDateStr = appObj?.appointment_date
                  ? new Date(appObj.appointment_date).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—';

                return (
                  <tr key={p.id_payment}>
                    <td className="row-number-cell">{index + 1}</td>
                    <td>
                      <strong>
                        {p.client_first_name
                          ? `${p.client_second_name || ''} ${p.client_first_name}`
                          : clientObj
                          ? `${clientObj.second_name} ${clientObj.first_name}`
                          : p.client_email || 'Клиент'}
                      </strong>
                    </td>
                    <td>{appDateStr}</td>
                    <td>{payDateStr}</td>
                    <td>
                      <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>
                        {parseFloat(p.total).toLocaleString()} ₽
                      </strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => handleEdit(p)}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className="btn-action-delete"
                        onClick={() => handleDelete(p.id_payment)}
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
