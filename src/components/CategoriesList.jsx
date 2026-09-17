import { useState, useEffect } from 'react';
import { getСategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import AdminNavTabs from './AdminNavTabs';

export default function CategoriesList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    id_category: '',
    title: '',
  });

  const [formError, setFormError] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const data = await getСategories();
      setCategories(data);
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
      if (formData.id_category) {
        await updateCategory(formData.id_category, formData);
      } else {
        await createCategory(formData);
      }
      setFormData({
        id_category: '',
        title: '',
      });
      loadData();
    } catch (err) {
      setFormError(err.message);
    }
  }

  function handleEdit(category) {
    setFormData({
      id_category: category.id_category,
      title: category.title || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm('Вы уверены, что хотите удалить эту категорию?')) return;
    try {
      await deleteCategory(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancel() {
    setFormData({
      id_category: '',
      title: '',
    });
    setFormError(null);
  }

  return (
    <div className="admin-content-card">
      <AdminNavTabs activeSection="categories" />

      <div className="admin-header-row">
        <h2>Категории услуг</h2>
        <span className="count-tag">Всего категорий: {categories.length}</span>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <h3>{formData.id_category ? 'Редактировать категорию' : 'Добавить категорию'}</h3>

        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="form-group">
            <label>Название категории *</label>
            <input
              type="text"
              name="title"
              placeholder="Например: Стрижки и укладки"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn-primary">
            {formData.id_category ? 'Сохранить изменения' : 'Добавить категорию'}
          </button>
          {formData.id_category && (
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Отмена
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="loading-state">
          <p>Загрузка категорий...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Название категории</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, index) => (
                <tr key={c.id_category}>
                  <td className="row-number-cell">{index + 1}</td>
                  <td>
                    <strong>{c.title}</strong>
                  </td>
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
                      onClick={() => handleDelete(c.id_category)}
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
