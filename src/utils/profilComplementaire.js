// Libellés et forme vide du profil complémentaire (situation familiale, langues,
// compétences, formations continues). Les codes sont ceux de l'API.

export const SITUATIONS = [
  ['CELIBATAIRE', 'Célibataire'],
  ['MARIE', 'Marié·e'],
  ['DIVORCE', 'Divorcé·e'],
  ['VEUF', 'Veuf·ve'],
];

export const NIVEAUX = [
  ['MATERNELLE', 'Langue maternelle'],
  ['COURANT', 'Courant'],
  ['INTERMEDIAIRE', 'Intermédiaire'],
  ['NOTIONS', 'Notions'],
];

export const LANGUES_COURANTES = ['Malagasy', 'Français', 'Anglais', 'Allemand', 'Espagnol', 'Chinois', 'Arabe'];

export const PROFIL_VIDE = {
  situationMatrimoniale: '', nombreEnfants: '', langues: [], competences: [], formations: [],
};

export function libelle(liste, code) {
  return liste.find(([valeur]) => valeur === code)?.[1] || code || '';
}

/** « Marié·e, 2 enfants » ; '' si rien n'est renseigné. */
export function situationFamiliale(profil) {
  const enfants = profil?.nombreEnfants;
  return [
    libelle(SITUATIONS, profil?.situationMatrimoniale),
    enfants != null && enfants !== '' && `${enfants} enfant${Number(enfants) > 1 ? 's' : ''}`,
  ].filter(Boolean).join(', ');
}

/** Le profil tel que l'API l'attend : champs vides retirés, nombres en nombres. */
export function versApi(profil) {
  const nombre = (valeur) => (valeur === '' || valeur == null ? null : Number(valeur));
  return {
    situationMatrimoniale: profil.situationMatrimoniale || null,
    nombreEnfants: nombre(profil.nombreEnfants),
    langues: profil.langues.filter((langue) => langue.langue.trim()),
    competences: profil.competences.filter((competence) => competence.trim()),
    formations: profil.formations
      .filter((formation) => formation.intitule.trim())
      .map((formation) => ({ ...formation, annee: nombre(formation.annee), dureeJours: nombre(formation.dureeJours) })),
  };
}

/** Le profil reçu de l'API, prêt à éditer (chaînes vides plutôt que null). */
export function depuisApi(reponse) {
  if (!reponse) return { ...PROFIL_VIDE };
  return {
    situationMatrimoniale: reponse.situationMatrimoniale || '',
    nombreEnfants: reponse.nombreEnfants ?? '',
    langues: (reponse.langues || []).map((langue) => ({ langue: langue.langue, niveau: langue.niveau })),
    competences: [...(reponse.competences || [])],
    formations: (reponse.formations || []).map((formation) => ({
      intitule: formation.intitule || '',
      organisme: formation.organisme || '',
      annee: formation.annee ?? '',
      dureeJours: formation.dureeJours ?? '',
    })),
  };
}

export function estVide(profil) {
  return !profil || (!profil.situationMatrimoniale && (profil.nombreEnfants === '' || profil.nombreEnfants == null)
    && profil.langues.length === 0 && profil.competences.length === 0 && profil.formations.length === 0);
}
