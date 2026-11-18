import { apiGet, apiPut } from './client';

// Situation familiale, langues, compétences et formations continues d'un agent.
export async function getProfilComplementaire(employeId) {
  return apiGet(`/api/employes/${encodeURIComponent(employeId)}/profil-complementaire`);
}

export async function saveProfilComplementaire(employeId, donnees) {
  return apiPut(`/api/employes/${encodeURIComponent(employeId)}/profil-complementaire`, donnees);
}

export async function getMonProfilComplementaire() {
  return apiGet('/api/profil/complementaire');
}

export async function saveMonProfilComplementaire(donnees) {
  return apiPut('/api/profil/complementaire', donnees);
}

/** Les compétences déjà saisies pour des agents (suggestions). */
export async function getCompetencesConnues() {
  const reponse = await apiGet('/api/referentiels/competences');
  return Array.isArray(reponse) ? reponse : reponse?.value || [];
}
