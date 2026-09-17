const API_URL = 'http://localhost:3001/api/carts';

// Получить все записи
export async function getCarts() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Ошибка при получении корзин');
  return await response.json();
}
export const getСarts = getCarts;

// Получить запись по ID
export async function getCartById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении корзины');
  return await response.json();
}

// Создать новую запись
export async function createCart(cart) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cart),
  });
  if (!response.ok) throw new Error('Ошибка при создании корзины');
  return await response.json();
}

// Обновить запись
export async function updateCart(id, cart) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cart),
  });
  if (!response.ok) throw new Error('Ошибка при обновлении корзины');
  return await response.json();
}

// Удалить запись
export async function deleteCart(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Ошибка при удалении корзины');
}
