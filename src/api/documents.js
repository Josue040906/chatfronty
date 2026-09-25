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

export async function getDocuments() {
  const response = await apiGet('/api/documents');
  return normalizeResponse(response);
}

export async function getDocumentById(id) {
  return apiGet(`/api/documents/${id}`);
}

export async function searchDocuments(query) {
  const value = query?.trim();

  if (!value) {
    return getDocuments();
  }

  const response = await apiGet(
    `/api/documents/recherche?query=${encodeURIComponent(value)}`
  );

  return normalizeResponse(response);
}

export async function getDocumentsByAgent(agentId) {
  const response = await apiGet(
    `/api/documents/agent/${agentId}`
  );

  return normalizeResponse(response);
}

export async function getDocumentHistory() {
  const response = await apiGet('/api/documents/historique');
  return normalizeResponse(response);
}

export async function createDocument(documentData) {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/documents`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentData),
    }
  );

  if (!response.ok) {
    let message = `Erreur API ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();

      if (errorData?.message) {
        message = errorData.message;
      }
    } catch {
      // La réponse d'erreur peut ne pas être du JSON.
    }

    throw new Error(message);
  }

  return response.json();
}