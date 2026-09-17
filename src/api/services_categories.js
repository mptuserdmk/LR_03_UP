const API_URL = 'http://localhost:3001/api/services_categories';


// Получить все категории услуг
export async function getServicesCategories() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Ошибка при получении категорий услуг');
  return await response.json();
}

// Получить запись по ID
export async function getServiceCategoryById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении категории услуги');
  return await response.json();
}
// Получить запись по ID
export async function getUserById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении пользователя');
  return await response.json();
}

// Создать новую запись
export async function createServiceCategory(service) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service),
  });
  if (!response.ok) throw new Error('Ошибка при создании категории услуги');
  return await response.json();
}

// Обновить запись
export async function updateServiceCategory(serviceId, categoryId, service) {
  const response = await fetch(`${API_URL}/${serviceId}/${categoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service),
  });
  if (!response.ok) throw new Error('Ошибка при обновлении категории услуги');
}

// Удалить запись
export async function deleteServiceCategory(serviceId, categoryId) {
  const response = await fetch(`${API_URL}/${serviceId}/${categoryId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Ошибка при удалении категории услуги');
}
