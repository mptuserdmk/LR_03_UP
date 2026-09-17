const API_URL = 'http://localhost:3001/api/services';

// Получить все услуги
export async function getServices() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Ошибка при получении услуг');
  return await response.json();
}

// Получить запись по ID
export async function getServiceById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении услуги');
  return await response.json();
}

// Создать новую запись
export async function createService(service) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service),
  });
  if (!response.ok) throw new Error('Ошибка при создании услуги');
  return await response.json();
}

// Обновить запись
export async function updateService(id, service) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service),
  });
  if (!response.ok) throw new Error('Ошибка при обновлении услуги');
}

// Удалить запись
export async function deleteService(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Ошибка при удалении услуги');
}
