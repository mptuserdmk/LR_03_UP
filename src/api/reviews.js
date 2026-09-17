const API_URL = 'http://localhost:3001/api/reviews';

export async function getReviews() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Ошибка при получении отзывов');
  return await response.json();
}

export async function createReview(review) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'Ошибка при создании отзыва');
    error.remaining = data.remaining;
    throw error;
  }
  return data;
}

export async function updateReview(id, review) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Ошибка при обновлении отзыва');
  }
  return await response.json();
}

export async function deleteReview(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Ошибка при удалении отзыва');
  }
}
