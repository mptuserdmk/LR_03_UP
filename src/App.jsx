import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Menu from './Menu';
import Login from './login';
import Services from './components/Services';
import Cart from './components/Cart';
import AdminDiscountManager from './components/AdminDiscountManager';
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
              <Route path="/" element={<Navigate to="/catalog" replace />} />
              <Route path="/catalog" element={<Services />} />
              <Route path="/available-services" element={<Navigate to="/catalog" replace />} />
              <Route path="/services" element={<Navigate to="/catalog" replace />} />
              <Route path="/cart" element={<Cart />} />
              
              {/* Admin Routes */}
              {isStaffOrAdmin && (
                <Route path="/admin" element={<AdminDiscountManager />} />
              )}

              <Route path="*" element={<Navigate to="/catalog" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
