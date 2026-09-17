import AppointmentsList from './components/AppointmentsList';
import AppointmentsServicesList from './components/AppointmentsServicesList';
import CartsList from './components/CartsList';
import CartsItemsList from './components/CartsItemsList';
import CategoriesList from './components/CategoriesList';
import DiscountsList from './components/DiscountsList';
import PaymentsList from './components/PaymentsList';
import RolesList from './components/RolesList';
import ServicesList from './components/ServicesList';
import ServicesCategoriesList from './components/ServicesCategoriesList';
import UsersList from './components/UsersList';
import Services from './components/Services';
import Cart from './components/Cart';
import Reviews from './components/Reviews';
import Profile from './components/Profile';

import AdminPanel from './AdminPanel';
import Menu from './Menu';
import Login from './login';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { user } = useAuth();
  const isStaffOrAdmin = user && (user.role_id === 1 || user.role_id === 2 || user.role_title === 'Главный администратор' || user.role_title?.includes('Сотрудник'));

  return (
    <BrowserRouter>
      {!user ? (
        <Login />
      ) : (
        <div className="app-container">
          <Menu />
          <main className="app-main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/available-services" replace />} />
              <Route path="/available-services" element={<Services />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/profile" element={<Profile />} />

              {/* Admin / Staff Routes */}
              <Route path="/categories" element={<CategoriesList />} />
              <Route path="/services" element={<ServicesList />} />
              <Route path="/discounts" element={<DiscountsList />} />
              <Route path="/users" element={<UsersList />} />
              <Route path="/roles" element={<RolesList />} />
              <Route path="/appointments" element={<AppointmentsList />} />
              <Route path="/appointments-services" element={<AppointmentsServicesList />} />
              <Route path="/services-categories" element={<ServicesCategoriesList />} />
              <Route path="/service-categories" element={<Navigate to="/services-categories" replace />} />
              <Route path="/carts" element={<CartsList />} />
              <Route path="/carts-items" element={<CartsItemsList />} />
              <Route path="/payments" element={<PaymentsList />} />

              <Route path="*" element={<Navigate to="/available-services" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
