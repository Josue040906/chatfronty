import { apiGet } from './client';

/** Tous les grades, rangés par type d'emploi, parcours et classe. */
export async function getParcoursGrades() {
  const response = await apiGet('/api/parcours');
  return Array.isArray(response) ? response : [];
}

/** La grille indiciaire : une ligne par case (parcours, catégorie, grade, indice). */
export async function getGrilleIndiciaire() {
  const response = await apiGet('/api/parcours/grille');
  return Array.isArray(response) ? response : [];
}
