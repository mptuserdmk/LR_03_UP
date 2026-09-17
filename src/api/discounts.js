const API_URL = 'http://localhost:3001/api/discounts';

// Получить все записи
export async function getDiscounts() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Ошибка при получении скидочных купонов');
  return await response.json();
}

// Получить запись по ID
export async function getDiscountById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении скидочного купона');
  return await response.json();
}

// Создать новую запись
export async function createDiscount(discount) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discount),
  });
  if (!response.ok) throw new Error('Ошибка при создании скидочного купона');
  return await response.json();
}

// Обновить запись
export async function updateDiscount(id, discount) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discount),
  });
  if (!response.ok) throw new Error('Ошибка при обновлении скидочного купона');
}

// Удалить запись
export async function deleteDiscount(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Ошибка при удалении скидочного купона');
}
