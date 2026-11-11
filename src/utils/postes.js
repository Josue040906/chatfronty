// État d'un poste tel que l'API le calcule : LIBRE (une place au moins),
// SE_LIBERE (complet, un départ annoncé dans l'année) ou COMPLET.

import { formatJour } from './documentCycle';

const ORDRE = { LIBRE: 0, SE_LIBERE: 1, COMPLET: 2 };

/** Les postes libres d'abord, puis ceux qui se libèrent, puis les complets ; l'ordre alphabétique ensuite. */
export function trierPostes(postes) {
  return [...(postes || [])].sort((a, b) =>
    (ORDRE[a.statut] ?? 3) - (ORDRE[b.statut] ?? 3)
    || String(a.intitule || '').localeCompare(String(b.intitule || ''), 'fr'));
}

/** « Gestionnaire RH — 1 place libre », « — complet (2/2) », « — se libère le 21/09/2027 ». */
export function libellePoste(poste) {
  const nom = poste?.intitule || 'Poste sans intitulé';
  if (poste?.statut === 'LIBRE') {
    return `${nom} — ${poste.libres} place${poste.libres > 1 ? 's' : ''} libre${poste.libres > 1 ? 's' : ''}`;
  }
  if (poste?.statut === 'SE_LIBERE') return `${nom} — se libère le ${formatJour(poste.se_libere_le)}`;
  if (poste?.statut === 'COMPLET') return `${nom} — complet (${poste.occupes}/${poste.nombre_places})`;
  return nom;
}

/** Totaux d'un ensemble de postes : places, occupées, libres, départs annoncés. */
export function totauxPostes(postes) {
  return (postes || []).reduce((total, poste) => ({
    postes: total.postes + 1,
    places: total.places + Number(poste.nombre_places || 0),
    occupees: total.occupees + Number(poste.occupes || 0),
    libres: total.libres + Number(poste.libres || 0),
    departs: total.departs + (poste.occupants || []).filter((agent) => agent.depart_prevu).length,
  }), { postes: 0, places: 0, occupees: 0, libres: 0, departs: 0 });
}
