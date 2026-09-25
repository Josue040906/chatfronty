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

export async function getGrades() {
  const response = await apiGet('/api/grades');

  return normalizeResponse(response);
}

export async function getGradeById(id) {
  return apiGet(`/api/grades/${id}`);
}

export async function searchGrades(query) {
  const value = query?.trim();

  if (!value) {
    return getGrades();
  }

  const response = await apiGet(
    `/api/grades/recherche?query=${encodeURIComponent(value)}`
  );

  return normalizeResponse(response);
}

export async function createGrade({
  codeGrade,
  typeEmploiId,
}) {
  return apiPost('/api/grades', {
    codeGrade,
    typeEmploiId,
  });
}

export async function updateGrade(
  id,
  {
    codeGrade,
    typeEmploiId,
  }
) {
  return apiPut(`/api/grades/${id}`, {
    codeGrade,
    typeEmploiId,
  });
}

export async function deleteGrade(id) {
  return apiDelete(`/api/grades/${id}`);
}
