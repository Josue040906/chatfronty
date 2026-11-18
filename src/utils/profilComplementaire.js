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

const normaliser = (texte) => String(texte || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const morceaux = (texte) => (typeof texte === 'string' ? texte.split(';').map((morceau) => morceau.trim()).filter(Boolean) : []);

/**
 * Langues, compétences et formations proposées par Band'IAkam, au format du
 * catalogue : langues « Français:COURANT;Anglais:NOTIONS », compétences
 * « Gestion de la paie;Rédaction juridique », formations « intitulé|organisme|année;… ».
 * null s'il n'y a rien.
 */
export function lirePropositionComplement(champs) {
  if (!champs || typeof champs !== 'object') return null;
  const codes = NIVEAUX.map(([code]) => code);
  const langues = morceaux(champs.langues).map((morceau) => {
    const [langue, niveau = ''] = morceau.split(':').map((partie) => partie.trim());
    return { langue, niveau: codes.includes(niveau.toUpperCase()) ? niveau.toUpperCase() : '' };
  }).filter((langue) => langue.langue);
  const competences = morceaux(champs.competences);
  const formations = morceaux(champs.formations).map((morceau) => {
    const [intitule = '', organisme = '', annee = ''] = morceau.split('|').map((partie) => partie.trim());
    return { intitule, organisme, annee: /^\d{4}$/.test(annee) ? annee : '', dureeJours: '' };
  }).filter((formation) => formation.intitule);
  return langues.length || competences.length || formations.length ? { langues, competences, formations } : null;
}

/**
 * Le profil, complété par la proposition : une langue déjà présente prend le
 * niveau proposé, une compétence ou une formation déjà présente n'est pas doublée.
 */
export function fusionnerProposition(profil, proposition) {
  const base = structuredClone(profil || PROFIL_VIDE);
  if (!proposition) return base;
  for (const langue of proposition.langues) {
    const existante = base.langues.find((l) => normaliser(l.langue) === normaliser(langue.langue));
    if (existante) {
      if (langue.niveau) existante.niveau = langue.niveau;
    } else {
      base.langues.push({ ...langue });
    }
  }
  for (const competence of proposition.competences) {
    if (!base.competences.some((c) => normaliser(c) === normaliser(competence))) base.competences.push(competence);
  }
  for (const formation of proposition.formations) {
    if (!base.formations.some((f) => normaliser(f.intitule) === normaliser(formation.intitule))) {
      base.formations.push({ ...formation });
    }
  }
  return base;
}
