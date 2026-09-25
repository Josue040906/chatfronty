import { apiGet } from './client';

function normalizeResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response?.value && Array.isArray(response.value)) {
    return response.value;
  }

  return [];
}

export async function getGrades() {
  const response = await apiGet('/api/grades');
  return normalizeResponse(response);
}

export async function getGradeById(id) {
  return apiGet(`/api/grades/${id}`);
}
