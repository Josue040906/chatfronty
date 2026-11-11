import { describe, expect, it } from 'vitest';
import { libellePoste, totauxPostes, trierPostes } from './postes';

const libre = { intitule: 'Testeur', statut: 'LIBRE', libres: 1, occupes: 0, nombre_places: 1, occupants: [] };
const complet = { intitule: 'Comptable', statut: 'COMPLET', libres: 0, occupes: 2, nombre_places: 2, occupants: [{}, {}] };
const seLibere = {
  intitule: 'Juriste', statut: 'SE_LIBERE', libres: 0, occupes: 1, nombre_places: 1,
  se_libere_le: '2027-09-21', occupants: [{ depart_prevu: '2027-09-21' }],
};

describe('postes', () => {
  it('puts free posts first, then those opening up, then full ones', () => {
    expect(trierPostes([complet, seLibere, libre]).map((p) => p.intitule)).toEqual(['Testeur', 'Juriste', 'Comptable']);
  });

  it('says plainly whether a post can be taken', () => {
    expect(libellePoste(libre)).toBe('Testeur — 1 place libre');
    expect(libellePoste(complet)).toBe('Comptable — complet (2/2)');
    expect(libellePoste(seLibere)).toBe('Juriste — se libère le 21/09/2027');
  });

  it('adds up places, occupied seats and announced departures', () => {
    expect(totauxPostes([libre, complet, seLibere]))
      .toEqual({ postes: 3, places: 4, occupees: 3, libres: 1, departs: 1 });
  });
});
