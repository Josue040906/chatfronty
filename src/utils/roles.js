// Droits affichés par l'interface. C'est l'API qui décide (403 sinon) :
// l'interface se contente de ne pas proposer ce qui serait refusé.

/** Créer, modifier, supprimer directions, services, postes, grades, statuts. */
export function canManageReferentiels(user) {
  return user?.role === 'SPERS_CHEF';
}
