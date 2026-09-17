import { useState, useEffect } from 'react';
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from '../api/discounts';
import AdminNavTabs from './AdminNavTabs';

export default function DiscountsList() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    id_discount: '',
    title: '',
    percentage: '10',
  });

  const [formError, setFormError] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const data = await getDiscounts();
      setDiscounts(data);
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
      if (formData.id_discount) {
        await updateDiscount(formData.id_discount, formData);
      } else {
        await createDiscount(formData);
      }
      setFormData({
        id_discount: '',
        title: '',
        percentage: '10',
      });
      loadData();
    } catch (err) {
      setFormError(err.message);
    }
  }

  function handleEdit(item) {
    setFormData({
      id_discount: item.id_discount,
      title: item.title || '',
      percentage: String(item.percentage || '0'),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm('Вы уверены, что хотите удалить эту скидку?')) return;
    try {
      await deleteDiscount(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancel() {
    setFormData({
      id_discount: '',
      title: '',
      percentage: '10',
    });
    setFormError(null);
  }

  return (
    <div className="admin-content-card">
      <AdminNavTabs activeSection="discounts" />

      <div className="admin-header-row">
        <h2>Скидки, акции и бонусные программы</h2>
        <span className="count-tag">Всего скидок: {discounts.length}</span>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <h3>{formData.id_discount ? 'Редактировать скидку' : 'Создать новую скидку'}</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Название скидки / акции *</label>
            <input
              type="text"
              name="title"
              placeholder="Например: Студенческая скидка"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Размер скидки (%) *</label>
            <input
              type="number"
              name="percentage"
              min="0"
              max="100"
              placeholder="15"
              value={formData.percentage}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn-primary">
            {formData.id_discount ? 'Сохранить изменения' : 'Создать скидку'}
          </button>
          {formData.id_discount && (
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Отмена
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="loading-state">
          <p>Загрузка скидок...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Наименование</th>
                <th>Процент экономии</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d, index) => (
                <tr key={d.id_discount}>
                  <td className="row-number-cell">{index + 1}</td>
                  <td>
                    <strong>{d.title}</strong>
                  </td>
                  <td>
                    <span className="badge-discount-tag" style={{ fontSize: '0.9rem' }}>
                      -{d.percentage}%
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-action-edit"
                      onClick={() => handleEdit(d)}
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      className="btn-action-delete"
                      onClick={() => handleDelete(d.id_discount)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}