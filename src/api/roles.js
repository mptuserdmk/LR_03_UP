const API_URL = 'http://localhost:3001/api/roles';

// Получить все записи
export async function getRoles() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Ошибка при получении ролей');
  return await response.json();
}

// Получить запись по ID
export async function getRoleById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении роли');
  return await response.json();
}

// Создать новую запись
export async function createRole(role) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(role),
  });
  if (!response.ok) throw new Error('Ошибка при создании роли');
  return await response.json();
}

// Обновить запись
export async function updateRole(id, role) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(role),
  });
  if (!response.ok) throw new Error('Ошибка при обновлении роли');
}

// Удалить запись
export async function deleteRole(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Ошибка при удалении роли');
}
