import { apiGet } from './client';

function normalizeResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response?.value && Array.isArray(response.value)) {
    return response.value;
  }

  return response;
}

export async function getCareerAnalysis(employeId) {
  const response = await apiGet(
    `/api/carriere/analyse?employeId=${employeId}`
  );

  return normalizeResponse(response);
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