import { apiGet } from './client';

/** Ce qui attend une action de l'utilisateur connecté (GET /api/a-faire). */
export async function getAFaire(signal) {
  const response = await apiGet('/api/a-faire', { signal });

  return Array.isArray(response?.elements) ? response.elements : [];
}
