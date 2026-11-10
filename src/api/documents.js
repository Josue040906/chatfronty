import {
  apiGet,
  apiGetBlob,
  apiPostBlob,
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

export async function getDocuments() {
  const response = await apiGet('/api/documents');

  return normalizeResponse(response);
}

export async function getDocumentTypes() {
  return normalizeResponse(
    await apiGet('/api/documents/types')
  );
}

export async function getDocumentRequests() {
  return normalizeResponse(
    await apiGet('/api/documents/demandes')
  );
}

export async function createDocumentRequest(documentData) {
  return apiPost('/api/documents/demandes', documentData);
}

/** Aperçu PDF d'une demande en cours de saisie : validée, jamais enregistrée. */
export async function previewDocumentRequestPdf(request) {
  return apiPostBlob('/api/documents/demandes/apercu-pdf', request);
}

export async function getDocumentRequestPdf(id) {
  return apiGetBlob(
    `/api/documents/demandes/${encodeURIComponent(id)}/pdf`
  );
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

// Cycle de vie : l'API vérifie chaque étape et qui a le droit de la faire.
/** Applique la demande : son effet (avancement, mutation, retraite) est produit par l'API. */
export async function appliquerDocument(id) {
  return apiPost(`/api/documents/${encodeURIComponent(id)}/appliquer`, {});
}

export async function annulerDocument(id) {
  return apiPost(`/api/documents/${encodeURIComponent(id)}/annuler`, {});
}

export async function archiverDocument(id) {
  return apiPut(`/api/documents/${encodeURIComponent(id)}/archiver`, {});
}
