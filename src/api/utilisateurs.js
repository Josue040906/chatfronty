import { apiGet, apiPost, apiPut } from './client';

export async function inscrireUtilisateur(
  matricule,
  email,
  password
) {
  if (!matricule || !email || !password) {
    throw new Error('Tous les champs sont obligatoires.');
  }

  return apiPost('/api/utilisateurs/inscription', {
    matricule,
    email,
    password,
  });
}

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

export async function listerComptesEnAttente() {
  return apiGet('/api/utilisateurs/en-attente');
}

export async function validerCompte(utilisateurId, decision) {
  const endpoint = decision === 'approuver' ? 'approuver' : 'refuser';

  return apiPut(`/api/utilisateurs/${endpoint}`, { utilisateurId });
}
