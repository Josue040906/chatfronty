// Cycle de vie d'une demande. Créée, elle produit la lettre signée et tamponnée
// hors de l'application ; la réponse reçue sur papier s'y saisit ensuite :
// Acceptée ou Refusée (signataire, acte, date). Une demande acceptée devient
// applicable à la date d'effet accordée (c'est une date, pas un statut), puis
// Appliquée par un agent du Personnel : son effet est produit par l'API.
// Créée, elle peut être Annulée ; appliquée, refusée ou annulée, elle s'Archive.
// Le front ne fait que montrer les actions permises ; l'API reste seule juge.

export const DOCUMENT_STATUSES = [
  { code: 'CREE', label: 'Sans réponse' },
  { code: 'ACCEPTE', label: 'Accepté' },
  { code: 'REFUSE', label: 'Refusé' },
  { code: 'APPLIQUE', label: 'Appliqué' },
  { code: 'ANNULE', label: 'Annulé' },
  { code: 'ARCHIVE', label: 'Archivé' },
];

/** Filtre « à appliquer » : des demandes acceptées dont la date d'effet est atteinte. */
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

/** Jours calendaires d'un congé, du premier au dernier inclus ; 0 si les dates sont incomplètes. */
export function joursConge(debut, fin) {
  if (!debut || !fin || fin < debut) return 0;
  return joursJusqua(fin, String(debut).slice(0, 10)) + 1;
}

/** « 17,5 » : un nombre de jours à la française. */
export function formatJours(valeur) {
  const nombre = Number(valeur);
  if (!Number.isFinite(nombre)) return '—';
  return nombre.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
}

/** « dans 12 jours », « demain », « aujourd'hui ». */
export function delaiLabel(jours) {
  if (jours == null) return '';
  if (jours <= 0) return 'aujourd’hui';
  if (jours === 1) return 'demain';
  return `dans ${jours} jours`;
}

/**
 * Où en est la demande : EN_ATTENTE (acceptée, date à venir), APPLICABLE
 * (acceptée, date atteinte), ou son statut enregistré (CREE, REFUSE…).
 */
export function documentPhase(document, today = isoToday()) {
  if (document?.statut === 'ACCEPTE') {
    const jours = joursJusqua(document.dateEffet, today);
    if (jours != null && jours > 0) {
      return { code: 'EN_ATTENTE', label: 'Accepté', jours };
    }
    return { code: APPLICABLE, label: 'À appliquer', jours: 0 };
  }
  const statut = DOCUMENT_STATUSES.find((item) => item.code === document?.statut);
  return { code: document?.statut || '', label: statut?.label || document?.statut || '—', jours: null };
}

/** Les actions possibles sur cette demande pour l'utilisateur connecté. */
export function documentActions(document, user, today = isoToday()) {
  const creee = document?.statut === 'CREE';
  const acceptee = document?.statut === 'ACCEPTE';
  const chef = user?.role === 'SPERS_CHEF';
  // Saisir la réponse et appliquer : tout agent du Service du Personnel.
  const personnel = chef || user?.role === 'SPERS_AGENT';
  const estAuteur = document?.auteurId != null && String(document.auteurId) === String(user?.userId);
  const phase = documentPhase(document, today);
  return {
    repondre: creee && personnel,
    appliquer: acceptee && personnel && phase.code === APPLICABLE,
    // Le bouton reste visible, désactivé, avec le temps qui reste.
    appliquerPlusTard: acceptee && personnel && phase.code === 'EN_ATTENTE',
    annuler: creee && (estAuteur || chef),
    archiver: ['APPLIQUE', 'REFUSE', 'ANNULE'].includes(document?.statut),
  };
}

/** « Accepté le 12/11/2026 par le Directeur des RH (Arrêté n° 12) — saisi par Lova ». */
export function decisionLabel(decision) {
  if (!decision) return '';
  const acte = decision.reference ? ` (${decision.reference})` : '';
  const saisie = decision.saisieParNom ? ` — saisie par ${decision.saisieParNom}` : '';
  return `Signée le ${formatJour(decision.date)} par ${decision.signataire}${acte}${saisie}`;
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
  if (typeCode === 'TITULARISATION') {
    const ligne = (s) => (s && s.gradeCode ? [`${s.typeEmploi} · ${s.gradeCode}`, `Indice ${s.indice ?? '—'}`] : null);
    const avant = ligne(donnees.situationActuelle);
    const apres = ligne(donnees.situationDemandee);
    return avant && apres ? { titre: 'Titularisation', avant, apres } : null;
  }
  if (typeCode === 'RETRAITE') {
    return { titre: 'Départ à la retraite', avant: ['En service'], apres: ['À la retraite'] };
  }
  if (typeCode === 'CONGE') {
    const jours = joursConge(donnees.dateDebut, donnees.dateFin);
    if (!jours) return null;
    return {
      titre: 'Congé',
      avant: ['Présent'],
      apres: [
        `Absent du ${formatJour(donnees.dateDebut)} au ${formatJour(donnees.dateFin)}`,
        `${jours} jour${jours > 1 ? 's' : ''} déduit${jours > 1 ? 's' : ''} du solde`,
      ],
    };
  }
  return null;
}
