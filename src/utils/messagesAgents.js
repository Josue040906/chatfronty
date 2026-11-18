import { ArrowLeftRight, CircleCheck, CircleX, Hourglass, Mail, TrendingUp } from 'lucide-react';

// Les libellés des e-mails aux agents, par type d'événement.
export const TYPES_MESSAGE = {
  MUTATION: 'Mutation',
  AVANCEMENT: 'Avancement',
  RECLASSEMENT: 'Reclassement',
  TITULARISATION: 'Titularisation',
  RETRAITE: 'Départ à la retraite',
  DEMANDE_ACCEPTEE: 'Demande acceptée',
  DEMANDE_REFUSEE: 'Demande refusée',
  AVANCEMENT_BIENTOT: 'Avancement dans le mois',
  AVANCEMENT_POSSIBLE: 'Avancement possible',
  RETRAITE_PROCHE: 'Retraite dans six mois',
};

export const STATUTS_MESSAGE = {
  PROPOSE: 'À envoyer',
  ENVOYE: 'Envoyé',
  ECARTE: 'Écarté',
  ECHEC: 'Échec',
};

/**
 * La famille d'un événement, pour sa couleur et son icône :
 * affectation (bleu), carrière (vert), retraite (ambre), refus (rouge).
 */
export function familleMessage(type) {
  switch (type) {
    case 'MUTATION':
      return { ton: 'affectation', Icone: ArrowLeftRight };
    case 'AVANCEMENT':
    case 'AVANCEMENT_BIENTOT':
    case 'AVANCEMENT_POSSIBLE':
    case 'RECLASSEMENT':
    case 'TITULARISATION':
      return { ton: 'carriere', Icone: TrendingUp };
    case 'RETRAITE':
    case 'RETRAITE_PROCHE':
      return { ton: 'retraite', Icone: Hourglass };
    case 'DEMANDE_ACCEPTEE':
      return { ton: 'carriere', Icone: CircleCheck };
    case 'DEMANDE_REFUSEE':
      return { ton: 'refus', Icone: CircleX };
    default:
      return { ton: 'autre', Icone: Mail };
  }
}

/** « il y a 5 min », « il y a 3 h », « hier à 14:05 », sinon la date. */
export function quandRelatif(valeur) {
  if (!valeur) return '';
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return String(valeur);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  const heure = new Intl.DateTimeFormat('fr-FR', { timeStyle: 'short' }).format(date);
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hier = new Date();
  hier.setDate(hier.getDate() - 1);
  if (date.toDateString() === new Date().toDateString()) return `aujourd’hui à ${heure}`;
  if (date.toDateString() === hier.toDateString()) return `hier à ${heure}`;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
