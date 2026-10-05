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
  code,
  libelle,
}) {
  return apiPost('/api/grades', {
    code,
    libelle,
  });
}

export async function updateGrade(
  id,
  {
    code,
    libelle,
  }
) {
  return apiPut(`/api/grades/${id}`, {
    code,
    libelle,
  });
}

export async function deleteGrade(id) {
  return apiDelete(`/api/grades/${id}`);
}
