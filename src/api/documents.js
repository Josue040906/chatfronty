import {
  apiGet,
  apiGetBlob,
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

export async function getDocumentRequestPdf(id) {
  return apiGetBlob(
    `/api/documents/demandes/${encodeURIComponent(id)}/pdf`
  );
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
  const response = await apiGet(
    '/api/documents/historique'
  );

  return normalizeResponse(response);
}

export async function createDocument(documentData) {
  return apiPost(
    '/api/documents',
    documentData
  );
}

export async function updateDocument(
  id,
  documentData
) {
  return apiPut(
    `/api/documents/${id}`,
    documentData
  );
}

export async function archiveDocument(id) {
  return apiPut(
    `/api/documents/${id}/archiver`,
    {}
  );
}