import { apiGet } from './client';

function normalizeResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  return [];
}

export async function getActivites() {
  const response = await apiGet('/api/activites');

  return normalizeResponse(response);
}