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

export async function getServices() {
  const response = await apiGet('/api/services');

  return normalizeResponse(response);
}

export async function getServiceById(id) {
  return apiGet(`/api/services/${id}`);
}

export async function searchServices(query) {
  const value = query?.trim();

  if (!value) {
    return getServices();
  }

  const response = await apiGet(
    `/api/services/recherche?query=${encodeURIComponent(value)}`
  );

  return normalizeResponse(response);
}

export async function createService(data) {
  return apiPost('/api/services', data);
}

export async function updateService(id, data) {
  return apiPut(`/api/services/${id}`, data);
}

export async function deleteService(id) {
  return apiDelete(`/api/services/${id}`);
}