const API_URL = 'http://localhost:3001/api/payments';

// Получить все записи
export async function getPayments() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Ошибка при получении платежей');
  return await response.json();
}

// Получить запись по ID
export async function getPaymentById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении платежа');
  return await response.json();
}

// Создать новую запись
export async function createPayment(payment) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
  });
  if (!response.ok) throw new Error('Ошибка при создании платежа');
  return await response.json();
}

// Обновить запись
export async function updatePayment(id, payment) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
  });
  if (!response.ok) throw new Error('Ошибка при обновлении платежа');
}

// Удалить запись
export async function deletePayment(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Ошибка при удалении платежа');
}
