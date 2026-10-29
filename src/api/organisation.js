import { apiGet } from './client';

function normalizeArray(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response?.value && Array.isArray(response.value)) {
    return response.value;
  }

  return [];
}

export async function getOrganisationData() {
  const [
    servicesResponse,
    postesResponse,
    agentsResponse,
  ] = await Promise.all([
    apiGet('/api/services'),
    apiGet('/api/postes'),
    apiGet('/api/employes'),
  ]);

  return {
    services: normalizeArray(servicesResponse),
    postes: normalizeArray(postesResponse),
    agents: normalizeArray(agentsResponse),
  };
}