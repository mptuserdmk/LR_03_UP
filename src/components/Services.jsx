import { useEffect, useState, useMemo } from 'react';
import { getServices } from '../api/services';
import { getServicesCategories } from '../api/services_categories';
import { getСategories, createCategory } from '../api/categories';
import { getDiscounts } from '../api/discounts';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { NavLink } from 'react-router-dom';

export default function Services() {
  const { user } = useAuth();
  const { addToCart, cart } = useCart();

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('popular');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // New Category inline form for Admin
  const [newCatTitle, setNewCatTitle] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [catError, setCatError] = useState('');

  const isStaffOrAdmin = user && (user.role_id === 1 || user.role_id === 2 || user.role_title === 'Главный администратор' || user.role_title?.includes('Сотрудник'));

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [servicesData, categoriesData, linksData, discountsData] = await Promise.all([
        getServices(),
        getСategories(),
        getServicesCategories(),
        getDiscounts(),
      ]);

      setServices(servicesData);
      setCategories(categoriesData);
      setServiceCategories(linksData);
      setDiscounts(discountsData);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки данных каталога с сервера');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const userDiscount = useMemo(() => {
    if (!user || !user.discount_id) return null;
    const found = discounts.find((d) => String(d.id_discount) === String(user.discount_id));
    return found && found.percentage > 0 ? found : null;
  }, [user, discounts]);

  const getServiceDiscount = (service) => {
    if (service.discount_percentage && service.discount_percentage > 0) {
      return { percentage: service.discount_percentage, title: service.discount_title };
    }
    if (!service.discount_id) return null;
    const found = discounts.find((d) => String(d.id_discount) === String(service.discount_id));
    return found && found.percentage > 0 ? found : null;
  };

  const getServiceCategories = (service) => {
    if (service.category_ids && Array.isArray(service.category_ids)) {
      return categories.filter((c) => service.category_ids.includes(c.id_category));
    }
    return serviceCategories
      .filter((link) => String(link.service_id) === String(service.id_service))
      .map((link) => categories.find((c) => String(c.id_category) === String(link.category_id)))
      .filter(Boolean);
  };

  const calculateFinalPrice = (basePrice, serviceDisc, userDisc) => {
    const original = parseFloat(basePrice) || 0;
    const servPct = serviceDisc ? Number(serviceDisc.percentage) : 0;
    const userPct = userDisc ? Number(userDisc.percentage) : 0;
    const effectivePct = Math.min(75, servPct + userPct);

    if (effectivePct === 0) {
      return { finalPrice: original, effectivePct: 0, hasDiscount: false };
    }
    const finalPrice = Math.round(original * (1 - effectivePct / 100));
    return { finalPrice, effectivePct, hasDiscount: true };
  };

  const handleCategoryCheckboxChange = (categoryId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatTitle.trim()) {
      setCatError('Введите название');
      return;
    }
    setAddingCategory(true);
    setCatError('');
    try {
      const created = await createCategory({ title: newCatTitle.trim() });
      setCategories((prev) => [...prev, created]);
      setNewCatTitle('');
      setToastMessage(`Категория «${created.title}» добавлена и сразу доступна в Aside!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      setCatError(err.message || 'Ошибка создания категории');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleAddToCart = async (service) => {
    try {
      await addToCart(service);
      setToastMessage(`«${service.title}» добавлена в корзину`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage('Ошибка при добавлении в корзину');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const getItemCartQty = (serviceId) => {
    const found = cart.find((item) => Number(item.service_id) === Number(serviceId) || Number(item.id_service) === Number(serviceId));
    return found ? found.quantity : 0;
  };

  const filteredServices = useMemo(() => {
    let result = services;

    // Filter by Category Checkboxes
    if (selectedCategoryIds.length > 0) {
      result = result.filter((service) => {
        const serviceCatIds = (service.category_ids && service.category_ids.length > 0)
          ? service.category_ids
          : serviceCategories
              .filter((link) => String(link.service_id) === String(service.id_service))
              .map((link) => link.category_id);

        return selectedCategoryIds.some((selectedId) => serviceCatIds.includes(selectedId));
      });
    }

    // Filter by Discount Only
    if (onlyDiscounted) {
      result = result.filter((service) => {
        const servDisc = getServiceDiscount(service);
        return servDisc && servDisc.percentage > 0;
      });
    }

    // Search query filter (tolerant text search)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);

      result = result.filter((service) => {
        const serviceCats = getServiceCategories(service).map((c) => c.title.toLowerCase()).join(' ');
        const servicePriceStr = String(service.price);
        const serviceDurationStr = `${service.duration} мин`;
        const searchableText = `${service.title} ${service.description || ''} ${serviceCats} ${servicePriceStr} ${serviceDurationStr}`.toLowerCase();

        return tokens.every((token) => {
          if (searchableText.includes(token)) return true;
          if (token.length >= 4) {
            const stem = token.substring(0, token.length - 1);
            if (searchableText.includes(stem)) return true;
          }
          return false;
        });
      });
    }

    // Max price filter
    result = result.filter((service) => {
      const servDisc = getServiceDiscount(service);
      const { finalPrice } = calculateFinalPrice(service.price, servDisc, userDiscount);
      return finalPrice <= maxPrice;
    });

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'price-asc') return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === 'price-desc') return parseFloat(b.price) - parseFloat(a.price);
      if (sortBy === 'duration') return (a.duration || 30) - (b.duration || 30);
      if (sortBy === 'discount') {
        const discA = getServiceDiscount(a)?.percentage || 0;
        const discB = getServiceDiscount(b)?.percentage || 0;
        return discB - discA;
      }
      return 0;
    });
  }, [services, selectedCategoryIds, onlyDiscounted, searchQuery, maxPrice, sortBy, serviceCategories, categories, discounts, userDiscount]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Каталог услуг и товаров</h1>
          <p className="page-subtitle">
            Профессиональные услуги салона, прозрачные цены и гарантированные скидки
          </p>
        </div>
        {userDiscount && (
          <div className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Ваш персональный купон: {userDiscount.title} ({userDiscount.percentage}%)
          </div>
        )}
      </div>

      {/* Global Toast Banner */}
      {toastMessage && (
        <div className="catalog-toast-banner">
          <span>{toastMessage}</span>
          <NavLink to="/cart" className="btn btn-primary btn-sm">Перейти в корзину</NavLink>
        </div>
      )}

      {/* Loading state message */}
      {loading && (
        <div className="catalog-loading-box">
          <div className="spinner-slate"></div>
          <p>Загрузка каталога услуг с сервера API...</p>
        </div>
      )}

      {/* Error state message */}
      {error && !loading && (
        <div className="catalog-error-box">
          <p className="error-title">Ошибка при запросе к серверу</p>
          <p className="error-desc">{error}</p>
          <button onClick={loadData} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
            Повторить попытку
          </button>
        </div>
      )}

      {/* Main Two-Column Layout with ASIDE on the left */}
      {!loading && !error && (
        <div className="catalog-layout">
          {/* ASIDE: Categories with Checkboxes & Filters */}
          <aside className="catalog-aside">
            <div className="aside-section">
              <div className="aside-header">
                <h3 className="aside-title">Категории</h3>
                {selectedCategoryIds.length > 0 && (
                  <button
                    type="button"
                    className="aside-reset-btn"
                    onClick={() => setSelectedCategoryIds([])}
                  >
                    Сбросить ({selectedCategoryIds.length})
                  </button>
                )}
              </div>

              {/* Checkbox: All categories */}
              <label className="category-checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.length === 0}
                  onChange={() => setSelectedCategoryIds([])}
                />
                <span className="checkbox-custom"></span>
                <span className="category-label-text">Все категории</span>
                <span className="category-count">{services.length}</span>
              </label>

              {/* Dynamic Categories list with Checkboxes */}
              <div className="categories-checkbox-list">
                {categories.map((cat) => {
                  const isChecked = selectedCategoryIds.includes(cat.id_category);
                  const count = services.filter((s) => {
                    const catIds = s.category_ids || serviceCategories.filter((sc) => sc.service_id === s.id_service).map((sc) => sc.category_id);
                    return catIds.includes(cat.id_category);
                  }).length;

                  return (
                    <label key={cat.id_category} className={`category-checkbox-label ${isChecked ? 'active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCategoryCheckboxChange(cat.id_category)}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="category-label-text">{cat.title}</span>
                      <span className="category-count">{count}</span>
                    </label>
                  );
                })}
              </div>

              {/* Admin direct category creation inside aside */}
              {isStaffOrAdmin && (
                <div className="aside-admin-box">
                  <div className="aside-admin-title">+ Добавить категорию</div>
                  <form onSubmit={handleAddCategory} className="aside-admin-form">
                    <input
                      type="text"
                      placeholder="Название категории..."
                      value={newCatTitle}
                      onChange={(e) => setNewCatTitle(e.target.value)}
                      disabled={addingCategory}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={addingCategory || !newCatTitle.trim()}>
                      {addingCategory ? '...' : 'Добавить'}
                    </button>
                  </form>
                  {catError && <div className="aside-admin-error">{catError}</div>}
                </div>
              )}
            </div>

            {/* Aside Special Filters */}
            <div className="aside-section">
              <h3 className="aside-title">Специальные предложения</h3>
              <label className="category-checkbox-label">
                <input
                  type="checkbox"
                  checked={onlyDiscounted}
                  onChange={(e) => setOnlyDiscounted(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span className="category-label-text">Товары со скидкой %</span>
                <span className="category-count">
                  {services.filter((s) => (getServiceDiscount(s)?.percentage || 0) > 0).length}
                </span>
              </label>
            </div>

            {/* Aside Price Slider */}
            <div className="aside-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h3 className="aside-title">Макс. стоимость</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: '600' }}>{maxPrice.toLocaleString()} ₽</span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="250"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </aside>

          {/* MAIN CONTENT: Top Toolbar & Services Grid */}
          <main className="catalog-main">
            <div className="catalog-toolbar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Поиск по названию или описанию услуги..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="sort-box">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Сортировка:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="popular">По умолчанию</option>
                  <option value="price-asc">По возрастанию цены</option>
                  <option value="price-desc">По убыванию цены</option>
                  <option value="discount">По размеру скидки %</option>
                  <option value="duration">По длительности (быстрые)</option>
                </select>
              </div>
            </div>

            {/* Results Count & Active Filters Bar */}
            <div className="catalog-results-bar">
              <span className="results-count">Найдено услуг: <strong>{filteredServices.length}</strong></span>
              {(selectedCategoryIds.length > 0 || onlyDiscounted || searchQuery) && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedCategoryIds([]);
                    setOnlyDiscounted(false);
                    setSearchQuery('');
                    setMaxPrice(10000);
                  }}
                >
                  Сбросить все фильтры
                </button>
              )}
            </div>

            {/* Services Grid */}
            {filteredServices.length === 0 ? (
              <div className="catalog-empty-state">
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '1rem' }}>
                  По заданным параметрам ничего не найдено.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedCategoryIds([]);
                    setOnlyDiscounted(false);
                    setSearchQuery('');
                    setMaxPrice(10000);
                  }}
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className="services-grid">
                {filteredServices.map((service) => {
                  const servDisc = getServiceDiscount(service);
                  const { finalPrice, effectivePct, hasDiscount } = calculateFinalPrice(
                    service.price,
                    servDisc,
                    userDiscount
                  );
                  const serviceCats = getServiceCategories(service);
                  const inCartQty = getItemCartQty(service.id_service);

                  return (
                    <div key={service.id_service} className="service-card">
                      <div className="service-card-media">
                        {service.image_url ? (
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="service-card-img"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="service-card-placeholder"
                          style={{ display: service.image_url ? 'none' : 'flex' }}
                        >
                          <span>{serviceCats[0]?.title || 'УСЛУГА'}</span>
                        </div>

                        {hasDiscount && (
                          <div className="service-card-discount-badge">
                            -{effectivePct}%
                          </div>
                        )}
                      </div>

                      <div className="service-card-body">
                        <div className="service-card-categories">
                          {serviceCats.map((c) => (
                            <span key={c.id_category} className="category-pill">{c.title}</span>
                          ))}
                        </div>

                        <h3 className="service-card-title">{service.title}</h3>
                        <p className="service-card-desc">{service.description || 'Профессиональная услуга в салоне.'}</p>

                        <div className="service-card-meta">
                          <div>
                            <span className="service-price">{finalPrice.toLocaleString()} ₽</span>
                            {hasDiscount && (
                              <span className="service-old-price">
                                {parseFloat(service.price).toLocaleString()} ₽
                              </span>
                            )}
                          </div>
                          <span className="service-duration">{service.duration || 30} мин.</span>
                        </div>

                        <div className="service-card-actions">
                          <button
                            type="button"
                            className={`btn ${inCartQty > 0 ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            style={{ width: '100%' }}
                            onClick={() => handleAddToCart(service)}
                          >
                            {inCartQty > 0 ? `В корзине (${inCartQty}) +` : 'Добавить в корзину'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}