// Cycle de vie d'un document : Brouillon → Validé (par son auteur, la demande
// prend effet) ou Annulé, puis Archivé. Le front ne fait que montrer les
// actions permises ; l'API reste seule juge et refuse toute autre étape.

export const DOCUMENT_STATUSES = [
  { code: 'BROUILLON', label: 'Brouillon' },
  { code: 'VALIDE', label: 'Validé' },
  { code: 'ANNULE', label: 'Annulé' },
  { code: 'ARCHIVE', label: 'Archivé' },
];

/** Les actions possibles sur ce document pour l'utilisateur connecté. */
export function documentActions(document, user) {
  const brouillon = document?.statut === 'BROUILLON';
  const chef = user?.role === 'SPERS_CHEF';
  const auteurConnu = document?.auteurId != null;
  const estAuteur = auteurConnu && String(document.auteurId) === String(user?.userId);
  return {
    // Seul l'auteur valide ; un document d'auteur inconnu se valide par un chef.
    valider: brouillon && (estAuteur || (!auteurConnu && chef)),
    annuler: brouillon && (estAuteur || chef),
    archiver: document?.statut === 'VALIDE' || document?.statut === 'ANNULE',
  };
}
