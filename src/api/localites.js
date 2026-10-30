import { apiGet } from './client';

async function getList(path) {
  const response = await apiGet(path);

  if (!Array.isArray(response)) {
    throw new Error('La liste des localités reçue du serveur est invalide.');
  }

  return response;
}

export function getRegions() {
  return getList('/api/localites/regions');
}

export function getDistricts(regionId) {
  return getList(
    `/api/localites/districts?regionId=${encodeURIComponent(regionId)}`
  );
}

export function getCommunes(districtId) {
  return getList(
    `/api/localites/communes?districtId=${encodeURIComponent(districtId)}`
  );
}

export function getQuartiers(communeId) {
  return getList(
    `/api/localites/quartiers?communeId=${encodeURIComponent(communeId)}`
  );
}

export async function getLocaliteDetails(id) {
  const response = await apiGet(`/api/localites/${encodeURIComponent(id)}`);

  if (
    !Array.isArray(response?.cheminAdministratif) ||
    !response.localite
  ) {
    throw new Error('Le détail de la localité reçu du serveur est invalide.');
  }

  return response;
}
