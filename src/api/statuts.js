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

export async function getStatuts() {
  const response = await apiGet('/api/statuts');
  return normalizeResponse(response);
}

export async function getStatutById(id) {
  return apiGet(`/api/statuts/${id}`);
}

export async function searchStatuts(query) {
  const value = query?.trim();

  if (!value) {
    return getStatuts();
  }

  const response = await apiGet(
    `/api/statuts/recherche?query=${encodeURIComponent(value)}`
  );

  return normalizeResponse(response);
}

export async function createStatut({
  code,
  libelle,
  description,
  dateDebutValidite,
  dateFinValidite,
}) {
  return apiPost('/api/statuts', {
    code,
    libelle,
    description,
    dateDebutValidite,
    dateFinValidite: dateFinValidite || null,
  });
}

export async function updateStatut(
  id,
  {
    code,
    libelle,
    description,
    dateDebutValidite,
    dateFinValidite,
  }
) {
  return apiPut(`/api/statuts/${id}`, {
    code,
    libelle,
    description,
    dateDebutValidite,
    dateFinValidite: dateFinValidite || null,
  });
}

export async function deleteStatut(id) {
  return apiDelete(`/api/statuts/${id}`);
}
