import { useState, useEffect } from 'react';
import { getAppointmentsServices, createAppointmentService, updateAppointmentService, deleteAppointmentService } from '../api/appointments_services';
import { getAppointments } from '../api/appointments';
import { getServices } from '../api/services';
import { getUsers } from '../api/users';
import AdminNavTabs from './AdminNavTabs';

export default function AppointmentsServicesList() {
  const [links, setLinks] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    appointment_id: '',
    service_id: '',
    quantity: '1',
  });

  const [editKeys, setEditKeys] = useState(null); // { appointmentId, serviceId }
  const [formError, setFormError] = useState(null);

  async function loadAllData() {
    try {
      setLoading(true);
      setError(null);
      const [linksData, appData, servicesData, usersData] = await Promise.all([
        getAppointmentsServices(),
        getAppointments(),
        getServices(),
        getUsers(),
      ]);
      setLinks(linksData);
      setAppointments(appData);
      setServices(servicesData);
      setUsers(usersData);
      if (appData.length > 0 && servicesData.length > 0 && !formData.appointment_id) {
        setFormData({
          appointment_id: String(appData[0].id_appointment),
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
        await updateAppointmentService(editKeys.appointmentId, editKeys.serviceId, formData);
      } else {
        await createAppointmentService(formData);
      }
      setFormData({
        appointment_id: appointments[0] ? String(appointments[0].id_appointment) : '',
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
      appointmentId: item.appointment_id,
      serviceId: item.service_id,
    });
    setFormData({
      appointment_id: String(item.appointment_id),
      service_id: String(item.service_id),
      quantity: String(item.quantity || '1'),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(appId, servId) {
    if (!window.confirm('Вы уверены, что хотите удалить эту услугу из записи?')) return;
    try {
      await deleteAppointmentService(appId, servId);
      loadAllData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancel() {
    setEditKeys(null);
    setFormData({
      appointment_id: appointments[0] ? String(appointments[0].id_appointment) : '',
      service_id: services[0] ? String(services[0].id_service) : '',
      quantity: '1',
    });
    setFormError(null);
  }

  return (
    <div className="admin-content-card">
      <AdminNavTabs activeSection="appointments-services" />

      <div className="admin-header-row">
        <h2>Услуги в записях клиентов</h2>
        <span className="count-tag">Всего позиций: {links.length}</span>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <h3>{editKeys ? 'Редактировать количество' : 'Добавить услугу в запись'}</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Запись клиента *</label>
            <select
              name="appointment_id"
              value={formData.appointment_id}
              onChange={handleChange}
              disabled={Boolean(editKeys)}
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
              max="10"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn-primary">
            {editKeys ? 'Сохранить изменения' : 'Добавить услугу в запись'}
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
          <p>Загрузка данных...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Клиент и запись</th>
                <th>Услуга</th>
                <th>Стоимость за ед.</th>
                <th>Кол-во</th>
                <th>Итого</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {links.map((it, index) => {
                const appObj = appointments.find((a) => String(a.id_appointment) === String(it.appointment_id));
                const clientObj = users.find((u) => String(u.id_user) === String(appObj?.user_id));
                const servObj = services.find((s) => String(s.id_service) === String(it.service_id));
                const unitPrice = parseFloat(it.price || servObj?.price || 0);
                const total = unitPrice * (parseInt(it.quantity, 10) || 1);

                const dateStr = appObj?.appointment_date
                  ? new Date(appObj.appointment_date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—';

                return (
                  <tr key={`${it.appointment_id}-${it.service_id}`}>
                    <td className="row-number-cell">{index + 1}</td>
                    <td>
                      <strong>
                        {it.client_first_name
                          ? `${it.client_second_name || ''} ${it.client_first_name}`
                          : clientObj
                          ? `${clientObj.second_name} ${clientObj.first_name}`
                          : 'Клиент'}
                      </strong>
                      <small style={{ display: 'block', color: '#9ca3af' }}>{dateStr}</small>
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
                        onClick={() => handleDelete(it.appointment_id, it.service_id)}
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
