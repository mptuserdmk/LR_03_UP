import { useState, useEffect } from 'react';
import { getRoles, createRole, updateRole, deleteRole } from '../api/roles';
import AdminNavTabs from './AdminNavTabs';

export default function RolesList() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    id_role: '',
    title: '',
  });

  const [formError, setFormError] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
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
      if (formData.id_role) {
        await updateRole(formData.id_role, formData);
      } else {
        await createRole(formData);
      }
      setFormData({
        id_role: '',
        title: '',
      });
      loadData();
    } catch (err) {
      setFormError(err.message);
    }
  }

  function handleEdit(role) {
    setFormData({
      id_role: role.id_role,
      title: role.title || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id, title) {
    if (title.includes('Главный') || id === 1) {
      alert('Запрещено удалять базовую системную роль Главного администратора');
      return;
    }
    if (!window.confirm('Вы уверены, что хотите удалить эту роль?')) return;
    try {
      await deleteRole(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancel() {
    setFormData({
      id_role: '',
      title: '',
    });
    setFormError(null);
  }

  return (
    <div className="admin-content-card">
      <AdminNavTabs activeSection="roles" />

      <div className="admin-header-row">
        <h2>Системные роли и уровни доступа</h2>
        <span className="count-tag">Всего ролей: {roles.length}</span>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <h3>{formData.id_role ? 'Редактировать роль' : 'Создать новую роль'}</h3>

        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="form-group">
            <label>Наименование роли *</label>
            <input
              type="text"
              name="title"
              placeholder="Например: Старший барбер"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn-primary">
            {formData.id_role ? 'Сохранить изменения' : 'Создать роль'}
          </button>
          {formData.id_role && (
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Отмена
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="loading-state">
          <p>Загрузка ролей...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Наименование роли</th>
                <th>Уровень привилегий</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r, index) => {
                const isSuper = r.id_role === 1 || r.title.includes('Главный');
                return (
                  <tr key={r.id_role}>
                    <td className="row-number-cell">{index + 1}</td>
                    <td>
                      <span className={`role-badge role-badge--${r.id_role}`}>
                        {r.title}
                      </span>
                    </td>
                    <td>
                      {isSuper
                        ? 'Полный доступ (Администрирование & Настройки)'
                        : r.id_role === 2
                        ? 'Операционный доступ (Записи & Клиенты)'
                        : r.id_role === 3
                        ? 'Специалист (Расписание & Процедуры)'
                        : 'Клиентский доступ (Витрина & Запись)'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => handleEdit(r)}
                      >
                        Редактировать
                      </button>
                      {!isSuper && (
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => handleDelete(r.id_role, r.title)}
                        >
                          Удалить
                        </button>
                      )}
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
