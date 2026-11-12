/**
 * Le ton d'un type d'emploi : une seule correspondance pour toute l'application
 * (badges, avatars, escalier de l'indice, historique…). La classe `type-<ton>`
 * donne au composant les variables CSS --type et --type-soft.
 */
const TONS = {
  Fonctionnaire: 'fonctionnaire',
  'Agent contractuel': 'contractuel',
  Stagiaire: 'stagiaire',
};

export function tonTypeEmploi(type) {
  return TONS[type] || '';
}

/** La classe CSS du type d'emploi (vide si le type est inconnu). */
export function classeTypeEmploi(type) {
  const ton = tonTypeEmploi(type);
  return ton ? `type-${ton}` : '';
}
