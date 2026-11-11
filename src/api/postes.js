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
  nombrePlaces,
}) {
  return apiPost('/api/postes', {
    intitule,
    description,
    serviceId,
    nombrePlaces,
  });
}

/** Postes d'un service ou d'une direction avec leur état : places, occupants, départs annoncés. */
export async function getEtatPostes({ serviceId, directionId } = {}) {
  const params = new URLSearchParams();
  if (serviceId != null) params.set('serviceId', serviceId);
  if (directionId != null) params.set('directionId', directionId);
  const response = await apiGet(`/api/postes/etat?${params.toString()}`);
  return Array.isArray(response) ? response : [];
}

/** Qui pourrait reprendre ce poste (même direction, catégorie au moins égale). */
export async function getReleve(posteId) {
  const response = await apiGet(`/api/postes/${encodeURIComponent(posteId)}/releve`);
  return Array.isArray(response) ? response : [];
}

export async function updatePoste(
  id,
  {
    intitule,
    description,
    serviceId,
    nombrePlaces,
  }
) {
  return apiPut(`/api/postes/${id}`, {
    intitule,
    description,
    serviceId,
    nombrePlaces,
  });
}

export async function deletePoste(id) {
  return apiDelete(`/api/postes/${id}`);
}
