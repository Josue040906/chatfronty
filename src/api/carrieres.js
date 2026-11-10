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

/** Années de service exigées pour la retraite, jour où l'agent les atteint, départ déjà pris. */
export async function getRetraiteAnalyse(employeId) {
  return apiGet(`/api/carrieres/employes/${encodeURIComponent(employeId)}/retraite`);
}

/** Départ à la retraite immédiat (même effet qu'une demande de retraite appliquée). */
export async function prendreRetraite(employeId, dateEffet) {
  return apiPost(`/api/carrieres/employes/${encodeURIComponent(employeId)}/retraite`, { dateEffet });
}

/** Congés : acquis, pris et solde au jour donné (aujourd'hui par défaut), congé en cours, congés de l'année. */
export async function getConges(employeId, date) {
  const suffixe = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiGet(`/api/carrieres/employes/${encodeURIComponent(employeId)}/conges${suffixe}`);
}

/** Titularisation : situation actuelle, grades de fonctionnaire avec leur indice, grade proposé. */
export async function getTitularisation(employeId) {
  return apiGet(`/api/carrieres/employes/${encodeURIComponent(employeId)}/titularisation`);
}

/** Titularisation immédiate (même effet qu'une demande de titularisation appliquée). */
export async function titulariser(employeId, dateEffet, echelonId) {
  return apiPost(`/api/carrieres/employes/${encodeURIComponent(employeId)}/titularisation`, { dateEffet, echelonId });
}
