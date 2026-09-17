const API_URL = 'http://localhost:3001/api/carts_items';

// Получить все записи
export async function getCartsItems() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Ошибка при получении элементов корзины');
  return await response.json();
}

// Получить запись по ID
export async function getCartItemsById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении элемента корзины');
  return await response.json();
}

// Создать новую запись
export async function createCartItem(data) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Ошибка при создании элемента корзины');
  return await response.json();
}
export const createCartItems = createCartItem;

// Обновить запись
export async function updateCartItem(cartId, serviceId, data) {
  const response = await fetch(`${API_URL}/${cartId}/${serviceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Ошибка при обновлении элемента корзины');
  return await response.json();
}
export const updateCartItems = updateCartItem;

// Удалить запись
export async function deleteCartItem(cartId, serviceId) {
  const url = serviceId ? `${API_URL}/${cartId}/${serviceId}` : `${API_URL}/${cartId}`;
  const response = await fetch(url, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Ошибка при удалении элемента корзины');
}
export const deleteCartItems = deleteCartItem;
