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

/**
 * La réponse reçue sur papier : { decision: 'ACCEPTE' | 'REFUSE', signataire,
 * dateDecision, motif, dateEffet } (dateEffet : date accordée, facultative).
 */
export async function deciderDocument(id, reponse) {
  return apiPost(`/api/documents/${encodeURIComponent(id)}/decision`, reponse);
}

/** Les demandes d'un agent, filtrées au besoin par statut (ACCEPTE…) et type (AVANCEMENT…). */
export async function getDemandesAgent(employeId, statut, typeCode) {
  const params = new URLSearchParams({ employeId: String(employeId) });
  if (statut) params.set('statut', statut);
  if (typeCode) params.set('type', typeCode);
  return normalizeResponse(await apiGet(`/api/documents?${params}`));
}

/** Les signataires possibles : directeurs et chefs de service en poste ({ nom, poste, service, direction, libelle }). */
export async function getSignataires() {
  return normalizeResponse(await apiGet('/api/documents/signataires'));
}

/** Annuler une demande créée ou acceptée ; le motif est exigé pour une demande acceptée. */
export async function annulerDocument(id, motif) {
  return apiPost(`/api/documents/${encodeURIComponent(id)}/annuler`, motif ? { motif } : {});
}

export async function archiverDocument(id) {
  return apiPut(`/api/documents/${encodeURIComponent(id)}/archiver`, {});
}

/** Les destinataires possibles d'une demande : { poste_id, fonction, titulaire }. */
export async function getDestinataires() {
  return normalizeResponse(await apiGet('/api/documents/destinataires'));
}

/** Le décideur par défaut d'un type de demande (posteId null : aucun). Réservé au chef. */
export async function changerDestinataireType(typeDocumentId, posteId) {
  return apiPut(`/api/documents/types/${encodeURIComponent(typeDocumentId)}/destinataire`, { posteId: posteId || null });
}
