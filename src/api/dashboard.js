import { apiGet } from './client';

export async function getDashboardData() {
  const [
    employeesResponse,
    servicesResponse,
    postesResponse,
  ] = await Promise.all([
    apiGet('/api/employes'),
    apiGet('/api/services'),
    apiGet('/api/postes'),
  ]);

  return {
    employees: Array.isArray(employeesResponse)
      ? employeesResponse
      : employeesResponse.value || [],

    services: Array.isArray(servicesResponse)
      ? servicesResponse
      : servicesResponse.value || [],

    postes: Array.isArray(postesResponse)
      ? postesResponse
      : postesResponse.value || [],
  };
}