import { useState, useEffect } from 'react';
import { getServicesCategories, createServiceCategory, deleteServiceCategory } from '../api/services_categories';
import { getServices } from '../api/services';
import { getСategories } from '../api/categories';
import AdminNavTabs from './AdminNavTabs';

export default function ServicesCategoriesList() {
  const [links, setLinks] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    service_id: '',
    category_id: '',
  });

  const [formError, setFormError] = useState(null);

  async function loadAllData() {
    try {
      setLoading(true);
      setError(null);
      const [linksData, servicesData, categoriesData] = await Promise.all([
        getServicesCategories(),
        getServices(),
        getСategories(),
      ]);
      setLinks(linksData);
      setServices(servicesData);
      setCategories(categoriesData);
      if (servicesData.length > 0 && categoriesData.length > 0 && !formData.service_id) {
        setFormData({
          service_id: String(servicesData[0].id_service),
          category_id: String(categoriesData[0].id_category),
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
      await createServiceCategory(formData);
      loadAllData();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleDelete(serviceId, categoryId) {
    if (!window.confirm('Вы уверены, что хотите удалить эту привязку?')) return;
    try {
      await deleteServiceCategory(serviceId, categoryId);
      loadAllData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-content-card">
      <AdminNavTabs activeSection="service-categories" />

      <div className="admin-header-row">
        <h2>Связи услуг и категорий</h2>
        <span className="count-tag">Всего связей: {links.length}</span>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <h3>Привязать услугу к категории</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Услуга *</label>
            <select
              name="service_id"
              value={formData.service_id}
              onChange={handleChange}
              required
            >
              {services.map((s) => (
                <option key={s.id_service} value={s.id_service}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Категория *</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
            >
              {categories.map((c) => (
                <option key={c.id_category} value={c.id_category}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn-primary">
            Привязать услугу к категории
          </button>
        </div>
      </form>

      {loading ? (
        <div className="loading-state">
          <p>Загрузка связей...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Услуга</th>
                <th>Категория</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l, index) => {
                const servObj = services.find((s) => String(s.id_service) === String(l.service_id));
                const catObj = categories.find((c) => String(c.id_category) === String(l.category_id));

                return (
                  <tr key={`${l.service_id}-${l.category_id}`}>
                    <td className="row-number-cell">{index + 1}</td>
                    <td>
                      <strong>{servObj ? servObj.title : 'Услуга'}</strong>
                    </td>
                    <td>
                      <span className="cat-tag" style={{ fontSize: '0.88rem' }}>
                        {catObj ? catObj.title : 'Категория'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-delete"
                        onClick={() => handleDelete(l.service_id, l.category_id)}
                      >
                        Удалить связь
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
