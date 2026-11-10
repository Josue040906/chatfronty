import { apiGet } from './client';

/** Tous les grades, rangés par type d'emploi, parcours et classe. */
export async function getParcoursGrades() {
  const response = await apiGet('/api/parcours');
  return Array.isArray(response) ? response : [];
}
