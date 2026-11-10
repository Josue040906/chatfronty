// Cycle de vie d'une demande : Créée, elle devient applicable dès que sa date
// d'effet est atteinte (ce n'est pas un statut enregistré, c'est une date),
// puis Appliquée par son auteur : son effet est alors produit par l'API.
// Une demande créée peut être Annulée ; appliquée ou annulée, elle s'Archive.
// Le front ne fait que montrer les actions permises ; l'API reste seule juge.

export const DOCUMENT_STATUSES = [
  { code: 'CREE', label: 'Créé' },
  { code: 'APPLIQUE', label: 'Appliqué' },
  { code: 'ANNULE', label: 'Annulé' },
  { code: 'ARCHIVE', label: 'Archivé' },
];

/** Filtre « à appliquer » : des demandes créées dont la date d'effet est atteinte. */
export const APPLICABLE = 'APPLICABLE';

const JOUR_MS = 24 * 60 * 60 * 1000;

/** La date du jour au format AAAA-MM-JJ, dans le fuseau du navigateur. */
export function isoToday(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** Nombre de jours entre aujourd'hui et une date AAAA-MM-JJ (négatif si passée). */
export function joursJusqua(date, today = isoToday()) {
  if (!date) return null;
  return Math.round((Date.parse(String(date).slice(0, 10)) - Date.parse(today)) / JOUR_MS);
}

/** « 01/12/2026 » à partir d'une date AAAA-MM-JJ (ou d'un horodatage). */
export function formatJour(date) {
  if (!date) return '—';
  const [annee, mois, jour] = String(date).slice(0, 10).split('-');
  return jour && mois && annee ? `${jour}/${mois}/${annee}` : String(date);
}

/** « dans 12 jours », « demain », « aujourd'hui ». */
export function delaiLabel(jours) {
  if (jours == null) return '';
  if (jours <= 0) return 'aujourd’hui';
  if (jours === 1) return 'demain';
  return `dans ${jours} jours`;
}

/**
 * Où en est la demande : EN_ATTENTE (créée, date à venir), APPLICABLE (créée,
 * date atteinte), ou son statut enregistré (APPLIQUE, ANNULE, ARCHIVE).
 */
export function documentPhase(document, today = isoToday()) {
  if (document?.statut === 'CREE') {
    const jours = joursJusqua(document.dateEffet, today);
    if (jours != null && jours > 0) {
      return { code: 'EN_ATTENTE', label: 'Créé', jours };
    }
    return { code: APPLICABLE, label: 'À appliquer', jours: 0 };
  }
  const statut = DOCUMENT_STATUSES.find((item) => item.code === document?.statut);
  return { code: document?.statut || '', label: statut?.label || document?.statut || '—', jours: null };
}

/** Les actions possibles sur cette demande pour l'utilisateur connecté. */
export function documentActions(document, user, today = isoToday()) {
  const creee = document?.statut === 'CREE';
  const chef = user?.role === 'SPERS_CHEF';
  const auteurConnu = document?.auteurId != null;
  const estAuteur = auteurConnu && String(document.auteurId) === String(user?.userId);
  // Seul l'auteur applique ; une demande d'auteur inconnu s'applique par un chef.
  const peutAppliquer = creee && (estAuteur || (!auteurConnu && chef));
  const phase = documentPhase(document, today);
  return {
    appliquer: peutAppliquer && phase.code === APPLICABLE,
    // L'auteur voit le bouton, désactivé, avec le temps qui reste.
    appliquerPlusTard: peutAppliquer && phase.code === 'EN_ATTENTE',
    annuler: creee && (estAuteur || chef),
    archiver: document?.statut === 'APPLIQUE' || document?.statut === 'ANNULE',
  };
}

function situationGrade(situation) {
  if (!situation || typeof situation !== 'object') return null;
  const classe = situation.classeLibelle || 'Classe non précisée';
  return situation.echelonOrdre == null ? classe : `${classe} · échelon ${situation.echelonOrdre}`;
}

function situationAffectation(situation) {
  if (!situation || typeof situation !== 'object') return [];
  return [
    ['Direction', situation.direction],
    ['Service', situation.service],
    ['Poste', situation.poste],
    ['Lieu', situation.lieuTravail],
  ].filter(([, valeur]) => valeur);
}

/**
 * Ce que l'application produira : une ligne « avant » et une ligne « après »,
 * ou une simple note quand le type n'a pas d'effet automatique.
 */
export function documentEffect(document, typeCode) {
  const donnees = document?.donnees || {};
  if (typeCode === 'AVANCEMENT') {
    const avant = situationGrade(donnees.situationActuelle);
    const apres = situationGrade(donnees.situationDemandee);
    return avant && apres ? { titre: 'Avancement', avant: [avant], apres: [apres] } : null;
  }
  if (typeCode === 'MUTATION') {
    const avant = situationAffectation(donnees.situationActuelle);
    const apres = situationAffectation(donnees.situationDemandee);
    if (apres.length === 0) return null;
    // Seuls changent les éléments demandés ; le reste est conservé.
    const champs = apres.map(([libelle]) => libelle);
    return {
      titre: 'Mutation',
      avant: avant.filter(([libelle]) => champs.includes(libelle)).map(([l, v]) => `${l} : ${v}`),
      apres: apres.map(([l, v]) => `${l} : ${v}`),
    };
  }
  if (typeCode === 'RETRAITE') {
    return { titre: 'Départ à la retraite', avant: ['En service'], apres: ['À la retraite'] };
  }
  if (typeCode === 'CONGE') {
    return {
      titre: 'Congé',
      note: 'La demande sera marquée appliquée ; l’absence et le solde de congé arriveront avec la gestion des congés.',
    };
  }
  return null;
}
