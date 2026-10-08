export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
).replace(/\/+$/, '');

export function getAuthHeaders() {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return {};
  }

  try {
    const accessToken = JSON.parse(storedUser)?.accessToken;
    return accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};
  } catch (error) {
    console.error('Impossible de lire le jeton de session.', error);
    return {};
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return null;
}

async function handleResponse(response) {
  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      data?.message ||
      `Erreur API ${response.status}: ${response.statusText}`;

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

export async function apiGetBlob(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: getAuthHeaders(),
  });

  await handleResponse(response);

  return response.blob();
}

export async function apiPost(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });

  return handleResponse(response);
}

export async function apiPostFormData(path, formData) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  return handleResponse(response);
}

export async function apiPut(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });

  return handleResponse(response);
}

export async function apiDelete(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}
