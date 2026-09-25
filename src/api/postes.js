import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
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

export async function getPostes() {
  const response = await apiGet('/api/postes');

  return normalizeResponse(response);
}

export async function getPosteById(id) {
  return apiGet(`/api/postes/${id}`);
}

export async function searchPostes(query) {
  const value = query?.trim();

  if (!value) {
    return getPostes();
  }

  const response = await apiGet(
    `/api/postes/recherche?query=${encodeURIComponent(value)}`
  );

  return normalizeResponse(response);
}

export async function getPostesByService(serviceId) {
  const response = await apiGet(
    `/api/postes/service?serviceId=${encodeURIComponent(serviceId)}`
  );

  return normalizeResponse(response);
}

export async function createPoste({
  intitule,
  description,
  serviceId,
}) {
  return apiPost('/api/postes', {
    intitule,
    description,
    serviceId,
  });
}

export async function updatePoste(
  id,
  {
    intitule,
    description,
    serviceId,
  }
) {
  return apiPut(`/api/postes/${id}`, {
    intitule,
    description,
    serviceId,
  });
}

export async function deletePoste(id) {
  return apiDelete(`/api/postes/${id}`);
}
