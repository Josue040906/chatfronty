// Les règles de saisie d'un agent, reprises de l'API (qui reste seule juge) pour
// les signaler dès que l'utilisateur quitte le champ. Mêmes messages que l'API.

const NOM_AUTORISE = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;

/** Nom ou prénom : au moins deux lettres ; lettres, espaces, traits d'union, apostrophes, points. */
export function erreurNom(valeur, libelle, obligatoire) {
  const texte = String(valeur || '').trim();
  if (!texte) return obligatoire ? `${libelle} est obligatoire.` : '';
  if (texte.length > 100) return `${libelle} ne peut pas dépasser 100 caractères.`;
  if ((texte.match(/\p{L}/gu) || []).length < 2) return `${libelle} doit contenir au moins deux lettres.`;
  if (!NOM_AUTORISE.test(texte)) {
    return `${libelle} ne peut contenir que des lettres, des espaces, des traits d'union et des apostrophes.`;
  }
  return '';
}

export function erreurMatricule(valeur) {
  const texte = String(valeur || '').trim();
  if (!texte) return 'Le matricule est obligatoire.';
  if (texte.length > 30) return 'Le matricule ne peut pas dépasser 30 caractères.';
  return '';
}

export function erreurCin(valeur) {
  const texte = String(valeur || '').trim();
  if (!texte) return '';
  if (!/^\d+$/.test(texte)) return 'Le CIN ne contient que des chiffres.';
  return texte.length === 12 ? '' : `Le CIN doit contenir exactement 12 chiffres (${texte.length} saisis).`;
}

/** Une date AAAA-MM-JJ qui ne peut pas être future. */
export function erreurDatePassee(valeur, libelle, aujourdhui, obligatoire = false) {
  if (!valeur) return obligatoire ? `${libelle} est obligatoire.` : '';
  return valeur > aujourdhui ? `${libelle} ne peut pas être future.` : '';
}
