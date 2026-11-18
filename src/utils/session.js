/** Le rôle de la personne connectée, lu dans la session enregistrée (null si aucune). */
export function roleConnecte() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')?.role || null;
  } catch {
    return null;
  }
}

/** Service du Personnel (agent ou chef) : accès à la gestion des postes, aux e-mails… */
export function estServicePersonnel() {
  return ['SPERS_AGENT', 'SPERS_CHEF'].includes(roleConnecte());
}
