import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from './client';

function normalizeResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response?.value && Array.isArray(response.value)) {
    return response.value;
  }

  return [];
}

export async function getDirections() {
  const response = await apiGet('/api/directions');

  return normalizeResponse(response);
}

export async function getDirectionById(id) {
  return apiGet(`/api/directions/${id}`);
}

export async function createDirection(data) {
  return apiPost(
    '/api/directions',
    data
  );
}

export async function updateDirection(id, data) {
  return apiPut(
    `/api/directions/${id}`,
    data
  );
}

export async function deleteDirection(id) {
  return apiDelete(
    `/api/directions/${id}`
  );
}