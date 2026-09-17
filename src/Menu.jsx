import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';

function Menu() {
  const { user, logout } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();

  const isMainAdmin = user && (user.role_id === 1 || user.role_title === 'Главный администратор');
  const isStaff = user && (user.role_id === 2 || user.role_title?.includes('Сотрудник'));
  const isStaffOrAdmin = isMainAdmin || isStaff;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="topbar-header">
      <div className="topbar-left">
        <NavLink to="/catalog" className="brand-title">
          GRANITE SALON
        </NavLink>

        <nav className="nav-group">
          <NavLink
            to="/catalog"
            className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
          >
            Каталог услуг
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
          >
            Корзина
            {totalCount > 0 && <span className="nav-cart-badge">{totalCount}</span>}
          </NavLink>

          {isStaffOrAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
            >
              Управление (Админ)
            </NavLink>
          )}
        </nav>
      </div>

      <div className="topbar-right">
        {user && (
          <div className="user-profile-widget">
            <div className="user-info-text">
              <span className="user-name">
                {user.first_name || 'Пользователь'} {user.second_name || ''}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                <span className="user-role-badge">
                  {user.role_title || (user.role_id === 1 ? 'Администратор' : 'Клиент')}
                </span>
                {user.discount_percentage > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Купон {user.discount_percentage}%
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Menu;