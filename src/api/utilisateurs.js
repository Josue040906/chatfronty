import { apiPut } from './client';

export async function changerMotDePasse(
  userId,
  ancienMotDePasse,
  nouveauMotDePasse
) {
  if (!userId) {
    throw new Error('Utilisateur non identifié.');
  }

  if (!ancienMotDePasse || !nouveauMotDePasse) {
    throw new Error('Tous les champs du mot de passe sont obligatoires.');
  }

  return apiPut('/api/utilisateurs/mot-de-passe', {
    userId,
    ancienMotDePasse,
    nouveauMotDePasse,
  });
}