import { useEffect, useState, useMemo } from 'react';
import { getServices } from '../api/services';
import { getServicesCategories } from '../api/services_categories';
import { getСategories } from '../api/categories';
import { getDiscounts } from '../api/discounts';
import { getUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { NavLink, useSearchParams } from 'react-router-dom';

export default function Services() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [masters, setMasters] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('popular');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addMessage, setAddMessage] = useState(null);

  // Quick Time-Slot Booking Modal
  const [quickBookService, setQuickBookService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('11:30');
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [quickBookSuccess, setQuickBookSuccess] = useState(null);
  const [quickBookSubmitting, setQuickBookSubmitting] = useState(false);

  const timeSlots = ['09:00', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30'];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [servicesData, categoriesData, linksData, discountsData, usersData] = await Promise.all([
        getServices(),
        getСategories(),
        getServicesCategories(),
        getDiscounts(),
        getUsers(),
      ]);

      setServices(servicesData);
      setCategories(categoriesData);
      setServiceCategories(linksData);
      setDiscounts(discountsData);
      const staffMasters = usersData.filter((u) => u.role_id === 3 || u.role_title === 'Мастер');
      setMasters(staffMasters);
      if (staffMasters.length > 0) {
        setSelectedMasterId(String(staffMasters[0].id_user));
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL category query param
  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) {
      setSelectedCategoryIds([Number(catParam)]);
    }
  }, [searchParams]);

  const userDiscount = useMemo(() => {
    if (!user || !user.discount_id) return null;
    const found = discounts.find((d) => String(d.id_discount) === String(user.discount_id));
    return found && found.percentage > 0 ? found : null;
  }, [user, discounts]);

  const getServiceDiscount = (service) => {
    if (!service.discount_id) return null;
    const found = discounts.find((d) => String(d.id_discount) === String(service.discount_id));
    return found && found.percentage > 0 ? found : null;
  };

  const getServiceCategories = (service) => {
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

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const filteredServices = useMemo(() => {
    let result = services;

    if (selectedCategoryIds.length > 0) {
      result = result.filter((service) => {
        const serviceCats = serviceCategories
          .filter((link) => String(link.service_id) === String(service.id_service))
          .map((link) => link.category_id);
        return selectedCategoryIds.some((selectedId) => serviceCats.includes(selectedId));
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);

      result = result.filter((service) => {
        const serviceCats = getServiceCategories(service).map((c) => c.title.toLowerCase()).join(' ');
        const servicePriceStr = String(service.price);
        const serviceDurationStr = `${service.duration} мин минут`;
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

    result = result.filter((service) => {
      const servDisc = getServiceDiscount(service);
      const { finalPrice } = calculateFinalPrice(service.price, servDisc, userDiscount);
      return finalPrice <= maxPrice;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'price-asc') {
        return parseFloat(a.price) - parseFloat(b.price);
      }
      if (sortBy === 'price-desc') {
        return parseFloat(b.price) - parseFloat(a.price);
      }
      if (sortBy === 'duration') {
        return (a.duration || 30) - (b.duration || 30);
      }
      return 0;
    });
  }, [services, selectedCategoryIds, searchQuery, maxPrice, sortBy, serviceCategories, categories, discounts, userDiscount]);

  const handleAddToCart = async (service) => {
    try {
      await addToCart(service);
      setAddMessage(`«${service.title}» добавлена в корзину`);
      setTimeout(() => setAddMessage(null), 3000);
    } catch {
      setAddMessage('Ошибка при добавлении в корзину');
    }
  };

  const handleQuickBookSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Для онлайн-записи необходимо войти в систему.');
      return;
    }
    setQuickBookSubmitting(true);
    try {
      const appointmentDateTime = `${selectedDate}T${selectedSlot}:00`;
      const servDisc = getServiceDiscount(quickBookService);
      const { finalPrice } = calculateFinalPrice(quickBookService.price, servDisc, userDiscount);

      const appRes = await fetch('http://localhost:3001/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id_user,
          master_id: selectedMasterId ? Number(selectedMasterId) : null,
          appointment_date: appointmentDateTime,
          note: `Экспресс-запись на услугу «${quickBookService.title}»`,
          is_completed: false,
        }),
      });
      const newApp = await appRes.json();

      await fetch('http://localhost:3001/api/appointments-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: newApp.id_appointment,
          service_id: quickBookService.id_service,
          quantity: 1,
        }),
      });

      const chosenMaster = masters.find((m) => String(m.id_user) === String(selectedMasterId));
      setQuickBookSuccess({
        date: selectedDate,
        time: selectedSlot,
        masterName: chosenMaster ? `${chosenMaster.first_name} ${chosenMaster.second_name || ''}` : 'Любой свободный мастер',
        serviceTitle: quickBookService.title,
        finalPrice,
      });
    } catch (err) {
      alert('Ошибка при оформлении записи: ' + err.message);
    } finally {
      setQuickBookSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Загрузка каталога услуг...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p style={{ color: 'var(--accent-danger)' }}>{error}</p>
        <button onClick={loadData} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Повторить попытку
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Каталог услуг</h1>
          <p className="page-subtitle">
            Профессиональные услуги салона с прозрачными ценами и онлайн-записью
          </p>
        </div>
        {userDiscount && (
          <div className="badge badge-success" style={{ padding: '0.4rem 0.8rem' }}>
            Персональная скидка: {userDiscount.percentage}%
          </div>
        )}
      </div>

      {addMessage && (
        <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-strong)', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{addMessage}</span>
          <NavLink to="/cart" className="btn btn-primary btn-sm">Перейти в корзину</NavLink>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="services-filter-bar">
        <div>
          <input
            type="text"
            placeholder="Поиск по названию, описанию или категории..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="popular">По умолчанию</option>
            <option value="price-asc">Сначала недорогие</option>
            <option value="price-desc">Сначала премиум</option>
            <option value="duration">По времени (быстрые)</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>До: {maxPrice} ₽</span>
          <input
            type="range"
            min="500"
            max="10000"
            step="100"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="admin-nav-bar" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`admin-nav-tab ${selectedCategoryIds.length === 0 ? 'active' : ''}`}
          onClick={() => setSelectedCategoryIds([])}
        >
          Все ({services.length})
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategoryIds.includes(cat.id_category);
          return (
            <button
              key={cat.id_category}
              type="button"
              className={`admin-nav-tab ${isSelected ? 'active' : ''}`}
              onClick={() => handleCategoryToggle(cat.id_category)}
            >
              {cat.title}
            </button>
          );
        })}
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>По вашему запросу услуг не найдено</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategoryIds([]);
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
                    <span>{serviceCats[0]?.title || 'УСЛУГА САЛОНА'}</span>
                  </div>
                </div>

                <div className="service-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h3 className="service-card-title">{service.title}</h3>
                    {hasDiscount && (
                      <span className="badge badge-warning">-{effectivePct}%</span>
                    )}
                  </div>

                  <p className="service-card-desc">{service.description || 'Профессиональная услуга мастеров салона.'}</p>

                  <div className="service-card-meta">
                    <div>
                      <span className="service-price">{finalPrice.toLocaleString()} ₽</span>
                      {hasDiscount && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textDecoration: 'line-through', marginLeft: '0.4rem' }}>
                          {parseFloat(service.price).toLocaleString()} ₽
                        </span>
                      )}
                    </div>
                    <span className="service-duration">{service.duration || 30} мин.</span>
                  </div>

                  <div className="service-card-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAddToCart(service)}
                    >
                      В корзину
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setQuickBookService(service);
                        setQuickBookSuccess(null);
                      }}
                    >
                      Записаться
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Booking Modal */}
      {quickBookService && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Онлайн-запись</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setQuickBookService(null)}
              >
                ✕
              </button>
            </div>

            {quickBookSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div className="badge badge-success" style={{ marginBottom: '1rem', display: 'inline-block' }}>Запись подтверждена</div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>{quickBookSuccess.serviceTitle}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  Дата и время: <strong>{quickBookSuccess.date}, {quickBookSuccess.time}</strong>
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  Мастер: <strong>{quickBookSuccess.masterName}</strong>
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Сумма к оплате: <strong>{quickBookSuccess.finalPrice} ₽</strong>
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setQuickBookService(null)}
                >
                  Готово
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuickBookSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{quickBookService.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Длительность: {quickBookService.duration} мин. | Стоимость: {quickBookService.price} ₽
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Мастер</label>
                  <select
                    value={selectedMasterId}
                    onChange={(e) => setSelectedMasterId(e.target.value)}
                  >
                    {masters.map((m) => (
                      <option key={m.id_user} value={m.id_user}>
                        {m.first_name} {m.second_name || ''} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Дата визита</label>
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

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={quickBookSubmitting}
                >
                  {quickBookSubmitting ? 'Оформление...' : 'Подтвердить запись'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}