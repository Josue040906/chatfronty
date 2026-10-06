import {
  apiGet,
  apiPostFormData,
  apiPut,
} from './client';

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
    nom: data.nom,
    prenom: data.prenom,
    sexe: data.sexe,
    cin: data.cin,
    dateNaissance: data.dateNaissance || null,
    lieuNaissance: data.lieuNaissance,
    adresse: data.adresse,
    telephone: data.telephone,
  });
}

export async function uploadProfilPhoto(userId, file) {
  if (!userId) {
    throw new Error('Utilisateur non identifié.');
  }

  if (!file) {
    throw new Error('Aucune photo sélectionnée.');
  }

  const formData = new FormData();
  formData.append('file', file);

  return apiPostFormData(
    `/api/profil/photo?userId=${encodeURIComponent(userId)}`,
    formData
  );
}