const API_URL = 'http://localhost:3001/api/appointments_services';

// Получить все записи
export async function getAppointmentsServices() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Ошибка при получении записей');
  return await response.json();
}

// Получить запись по ID
export async function getAppointmentsServicesById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении записи');
  return await response.json();
}

// Создать новую запись
export async function createAppointmentService(data) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Ошибка при создании записи');
  return await response.json();
}
export const createAppointmentServices = createAppointmentService;

// Обновить запись
export async function updateAppointmentService(appId, serviceId, data) {
  const response = await fetch(`${API_URL}/${appId}/${serviceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Ошибка при обновлении записи');
  return await response.json();
}
export const updateAppointmentServices = updateAppointmentService;

// Удалить запись
export async function deleteAppointmentService(appId, serviceId) {
  const url = serviceId ? `${API_URL}/${appId}/${serviceId}` : `${API_URL}/${appId}`;
  const response = await fetch(url, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Ошибка при удалении записи');
}
export const deleteAppointmentServices = deleteAppointmentService;
