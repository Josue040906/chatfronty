import { apiGet, apiPut } from './client';

export async function getAgents() {
  const response = await apiGet('/api/employes');

  return Array.isArray(response)
    ? response
    : response.value || [];
}

export async function getAgentById(id) {
  return apiGet(`/api/employes/${id}`);
}

export async function updateAgent(id, data) {
  return apiPut(`/api/employes/${id}`, data);
}

export async function uploadAgentPhoto(id, file) {
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(
    `http://localhost:8080/api/employes/${id}/photo`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    let message = 'Erreur lors de l’envoi de la photo.';

    try {
      const data = await response.json();

      if (data?.message) {
        message = data.message;
      }
    } catch {
      // La réponse n'est pas forcément au format JSON.
    }

    throw new Error(message);
  }

  return response.json();
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
