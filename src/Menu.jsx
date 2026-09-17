import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';

function Menu() {
  const { user, logout } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [openDropdown, setOpenDropdown] = useState(null);
  const menuRef = useRef(null);

  const isMainAdmin = user && (user.role_id === 1 || user.role_title === 'Главный администратор');
  const isStaff = user && (user.role_id === 2 || user.role_title?.includes('Сотрудник'));
  const isStaffOrAdmin = isMainAdmin || isStaff;

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  const toggleDropdown = (name) => {
    setOpenDropdown(prev => prev === name ? null : name);
  };

  const adminTables = [
    ...(isMainAdmin ? [{ path: '/users', title: 'Пользователи' }] : []),
    { path: '/appointments', title: 'Записи клиентов' },
    { path: '/services', title: 'Услуги и цены' },
    { path: '/categories', title: 'Категории' },
    { path: '/discounts', title: 'Скидки и акции' },
    { path: '/payments', title: 'Платежи' },
    ...(isMainAdmin ? [{ path: '/roles', title: 'Роли пользователей' }] : []),
    { path: '/carts', title: 'Корзины' },
    { path: '/carts-items', title: 'Позиции в корзинах' },
    { path: '/services-categories', title: 'Связи категорий' },
    { path: '/appointments-services', title: 'Связи записей' }
  ];

  return (
    <header className="topbar-header" ref={menuRef}>
      <div className="topbar-left">
        <NavLink to="/available-services" className="brand-title">
          GRANITE SALON
        </NavLink>

        <nav className="nav-group">
          {/* Services Dropdown */}
          <div className="nav-dropdown-wrapper">
            <button
              className={`nav-btn ${location.pathname === '/available-services' ? 'active' : ''}`}
              onClick={() => toggleDropdown('services')}
            >
              Услуги
              <span className="dropdown-arrow">{openDropdown === 'services' ? '▲' : '▼'}</span>
            </button>
            {openDropdown === 'services' && (
              <div className="nav-dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={() => navigate('/available-services')}
                >
                  Все услуги
                </button>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={() => navigate('/available-services?category=1')}
                >
                  Стрижки и укладки
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => navigate('/available-services?category=2')}
                >
                  Борода и бритье
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => navigate('/available-services?category=3')}
                >
                  Окрашивание
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => navigate('/available-services?category=4')}
                >
                  Уход и спа-комплексы
                </button>
              </div>
            )}
          </div>

          {/* Reviews Link */}
          <NavLink
            to="/reviews"
            className={({ isActive }) => (isActive ? 'nav-btn active' : 'nav-btn')}
          >
            Отзывы
          </NavLink>

          {/* Cart / Booking Link */}
          <NavLink
            to="/cart"
            className={({ isActive }) => (isActive ? 'nav-btn active' : 'nav-btn')}
          >
            Корзина
            {totalCount > 0 && <span className="nav-counter">{totalCount}</span>}
          </NavLink>

          {/* Admin / Staff Tables Dropdown */}
          {isStaffOrAdmin && (
            <div className="nav-dropdown-wrapper">
              <button
                className={`nav-btn ${openDropdown === 'admin' ? 'active' : ''}`}
                onClick={() => toggleDropdown('admin')}
              >
                {isMainAdmin ? 'Управление' : 'Панель персонала'}
                <span className="dropdown-arrow">{openDropdown === 'admin' ? '▲' : '▼'}</span>
              </button>
              {openDropdown === 'admin' && (
                <div className="nav-dropdown-menu">
                  {adminTables.map((tab) => (
                    <button
                      key={tab.path}
                      className={`dropdown-item ${location.pathname === tab.path ? 'active' : ''}`}
                      onClick={() => navigate(tab.path)}
                    >
                      {tab.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Top Right User Profile */}
      <div className="topbar-right">
        {user ? (
          <div className="user-profile-summary">
            <span className="user-name-label">
              {user.first_name ? `${user.first_name} ${user.second_name || ''}` : user.email}
            </span>
            <span className="user-role-tag">
              {user.role_title || 'Клиент'}
            </span>
            <button
              onClick={logout}
              className="btn-minimal-logout"
              title="Завершить сеанс"
            >
              Выход
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="btn btn-primary btn-sm">
            Авторизация
          </NavLink>
        )}
      </div>
    </header>
  );
}

export default Menu;