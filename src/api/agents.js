import { apiGet } from './client';

export async function getAgents() {
  const response = await apiGet('/api/employes');

  return Array.isArray(response)
    ? response
    : response.value || [];
}

export async function getAgentById(id) {
  return apiGet(`/api/employes/${id}`);
}

export async function searchAgents(query) {
  const value = query?.trim();

  if (!value) {
    return getAgents();
  }

  const response = await apiGet(
    `/api/employes/recherche?query=${encodeURIComponent(value)}`
  );

  return Array.isArray(response)
    ? response
    : response.value || [];
}