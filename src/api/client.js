const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

    throw new Error(message);
  }

  return data;
}

export async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  return handleResponse(response);
}

export async function apiPost(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });

  return handleResponse(response);
}

export async function apiPut(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });

  return handleResponse(response);
}

export async function apiDelete(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
  });

  return handleResponse(response);
}
