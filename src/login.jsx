import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { loginUser, forgotPassword, resetPassword } from './api/users';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [receivedCode, setReceivedCode] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Поле Email обязательно для заполнения';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Введите корректный адрес электронной почты';
    }

    if (!password) {
      errors.password = 'Поле Пароль обязательно для заполнения';
    } else if (password.length < 4) {
      errors.password = 'Пароль должен содержать не менее 4 символов';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = await loginUser(email.trim(), password);
      login(userData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (testEmail, testPass) => {
    setEmail(testEmail);
    setPassword(testPass);
    setFieldErrors({});
    setError('');
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');
    if (!forgotEmail.trim()) {
      setForgotError('Введите email');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      setReceivedCode(res.code);
      setForgotMsg(`Код подтверждения: ${res.code}`);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Ошибка запроса кода');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');

    if (!resetCode.trim() || !newPassword.trim()) {
      setForgotError('Заполните код и новый пароль');
      return;
    }

    if (newPassword.length < 4) {
      setForgotError('Пароль должен быть от 4 символов');
      return;
    }

    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail.trim(), resetCode.trim(), newPassword);
      setForgotMsg('Пароль успешно изменен. Теперь вы можете войти.');
      setEmail(forgotEmail.trim());
      setPassword(newPassword);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotMsg('');
      }, 1500);
    } catch (err) {
      setForgotError(err.message || 'Неверный проверочный код');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Авторизация</h2>
          <p className="auth-subtitle">Вход в персональный кабинет и систему записи</p>
        </div>

        {error && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', textAlign: 'center', padding: '0.5rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
              }}
            />
            {fieldErrors.email && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{fieldErrors.email}</span>}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password">Пароль</label>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotEmail(email);
                  setForgotStep(1);
                  setForgotError('');
                  setForgotMsg('');
                }}
              >
                Забыли пароль?
              </button>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
              }}
            />
            {fieldErrors.password && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{fieldErrors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Проверка...' : 'Войти в систему'}
          </button>
        </form>

        {/* Quick Test Accounts Grid */}
        <div className="quick-accounts-grid">
          <button
            type="button"
            className="account-preset-btn"
            onClick={() => fillTestAccount('isip_m.k.devlet@gmail.com', 'admin123')}
          >
            <div className="account-preset-name">Максим</div>
            <div className="account-preset-role">Главный администратор</div>
          </button>

          <button
            type="button"
            className="account-preset-btn"
            onClick={() => fillTestAccount('elena.staff@salon.ru', 'staff123')}
          >
            <div className="account-preset-name">Елена</div>
            <div className="account-preset-role">Менеджер салона</div>
          </button>

          <button
            type="button"
            className="account-preset-btn"
            onClick={() => fillTestAccount('anna.master@salon.ru', '123456')}
          >
            <div className="account-preset-name">Анна</div>
            <div className="account-preset-role">Мастер-стилист</div>
          </button>

          <button
            type="button"
            className="account-preset-btn"
            onClick={() => fillTestAccount('ivan.petrov@mail.ru', '123456')}
          >
            <div className="account-preset-name">Иван</div>
            <div className="account-preset-role">Клиент</div>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Восстановление пароля</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowForgotModal(false)}
              >
                ✕
              </button>
            </div>

            {forgotError && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '0.75rem', padding: '0.4rem', textAlign: 'center' }}>{forgotError}</div>}
            {forgotMsg && <div className="badge badge-success" style={{ display: 'block', marginBottom: '0.75rem', padding: '0.4rem', textAlign: 'center' }}>{forgotMsg}</div>}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestCode}>
                <div className="form-group">
                  <label className="form-label">Укажите email аккаунта</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Отправка...' : 'Получить код'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Код подтверждения сформирован для <strong>{forgotEmail}</strong>: <code style={{ color: 'var(--text-main)', background: 'var(--bg-input)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{receivedCode}</code>
                </div>

                <div className="form-group">
                  <label className="form-label">6-значный проверочный код</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Новый пароль</label>
                  <input
                    type="password"
                    placeholder="Минимум 4 символа"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Сохранение...' : 'Установить новый пароль'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
