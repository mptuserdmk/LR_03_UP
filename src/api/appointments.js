const API_URL = 'http://localhost:3001/api/appointments';

// Получить все записи
export async function getAppointments() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Ошибка при получении записей');
  return await response.json();
}

// Получить запись по ID
export async function getAppointmentById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении записи');
  return await response.json();
}

// Создать новую запись
export async function createAppointment(appointment) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointment),
  });
  if (!response.ok) throw new Error('Ошибка при создании записи');
  return await response.json();
}

// Обновить запись
export async function updateAppointment(id, appointment) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointment),
  });
  if (!response.ok) throw new Error('Ошибка при обновлении записи');
}

// Удалить запись
export async function deleteAppointment(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Ошибка при удалении записи');
}
