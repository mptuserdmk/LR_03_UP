const API_URL = 'http://localhost:3001/api/users';
const AUTH_URL = 'http://localhost:3001/api/auth';

// Получить всех пользователей
export async function getUsers() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Ошибка при получении пользователей');
  return await response.json();
}

// Получить запись по ID
export async function getUserById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении пользователя');
  return await response.json();
}

// Создать новую запись
export async function createUser(user) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Ошибка при создании пользователя');
  }
  return await response.json();
}

// Обновить запись
export async function updateUser(id, user) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Ошибка при обновлении пользователя');
  }
  return await response.json();
}

// Удалить запись
export async function deleteUser(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Ошибка при удалении пользователя');
  }
}

// Логин пользователя
export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Неверный email или пароль');
  }
  return await response.json();
}

// Запрос кода для сброса пароля
export async function forgotPassword(email) {
  const response = await fetch(`${AUTH_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при запросе сброса пароля');
  }
  return data;
}

// Сброс пароля по коду
export async function resetPassword(email, code, new_password) {
  const response = await fetch(`${AUTH_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, new_password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при смене пароля');
  }
  return data;
}