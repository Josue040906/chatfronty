import { apiGet, apiPost } from './client';

function normalizeResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response?.value && Array.isArray(response.value)) {
    return response.value;
  }

  return response;
}

export async function analyserCarriere(employeId) {
  const response = await apiGet(
    `/api/carrieres/employes/${employeId}/analyse`
  );

  return normalizeResponse(response);
}

export async function getCareerAnalysis(employeId) {
  return analyserCarriere(employeId);
}

export async function getCurrentCareerSituation(employeId) {
  const response = await apiGet(
    `/api/carriere/situation-actuelle?employeId=${employeId}`
  );

  return normalizeResponse(response);
}

export async function getCareerHistory(employeId) {
  const response = await apiGet(
    `/api/carriere/historique?employeId=${employeId}`
  );

  return normalizeResponse(response);
}

export async function getEmployeeDiplomas(employeId) {
  const response = await apiGet(`/api/employes/${employeId}/diplomes`);
  return Array.isArray(response) ? response : response?.value || [];
}

export async function getDiplomaOptions(filters = {}) {
  const query = new URLSearchParams();
  if (filters.niveauId) query.set('niveauId', filters.niveauId);
  if (filters.domaineId) query.set('domaineId', filters.domaineId);
  const queryString = query.toString();
  const response = await apiGet(
    `/api/referentiels/diplomes/options${queryString ? `?${queryString}` : ''}`
  );

  return response?.value && !Array.isArray(response.value)
    ? response.value
    : response;
}

export async function addEmployeeDiploma(employeId, data) {
  return apiPost(`/api/employes/${employeId}/diplomes`, data);
}

export async function proposeEstablishment(data) {
  return apiPost('/api/referentiels/etablissements/demandes', data);
}

export async function getReclassementHistory(employeId) {
  const response = await apiGet(
    `/api/carrieres/employes/${employeId}/historique-reclassements`
  );
  return normalizeResponse(response);
}

export async function getReclassementProposal(employeId) {
  return apiGet(`/api/carrieres/employes/${employeId}/reclassement`);
}

export async function confirmReclassement(employeId) {
  return apiPost(`/api/employes/${employeId}/reclassement`);
}

export async function getAvancementProposal(employeId) {
  return apiGet(`/api/carrieres/employes/${employeId}/avancement`);
}

export async function confirmAvancement(employeId, dateEffet) {
  return apiPost(`/api/carrieres/employes/${employeId}/avancement`, {
    dateEffet,
  });
}
