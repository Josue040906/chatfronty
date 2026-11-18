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
