import { apiGet, apiGetBlob, apiPostFormData } from './client';

// Pièces scannées (photo ou PDF) d'où viennent un document ou un diplôme.
// cibleType : DOCUMENT ou DIPLOME. L'API décide des droits et vérifie le fichier.

export async function deposerPieceScannee(cibleType, cibleId, file) {
  const formData = new FormData();
  formData.append('cibleType', cibleType);
  formData.append('cibleId', String(cibleId));
  formData.append('file', file, file.name);
  return apiPostFormData('/api/pieces-scannees', formData);
}

export async function listerPiecesScannees(cibleType, cibleId, { signal } = {}) {
  const query = new URLSearchParams({ cibleType, cibleId: String(cibleId) });
  const response = await apiGet(`/api/pieces-scannees?${query}`, { signal });
  return Array.isArray(response) ? response : [];
}

export async function lirePieceScannee(id) {
  return apiGetBlob(`/api/pieces-scannees/${encodeURIComponent(id)}/fichier`);
}
