import { apiGet, apiPut } from './client';

export async function getProfil(userId) {
  if (!userId) {
    throw new Error('Utilisateur non identifié.');
  }

  return apiGet(`/api/profil?userId=${encodeURIComponent(userId)}`);
}

export async function updateProfil(userId, data) {
  if (!userId) {
    throw new Error('Utilisateur non identifié.');
  }

  return apiPut('/api/profil', {
    userId,
    adresse: data.adresse,
    telephone: data.telephone,
  });
}