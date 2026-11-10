import { describe, expect, it } from 'vitest';
import { documentActions } from './documentCycle';

const auteur = { userId: 5, role: 'SPERS_AGENT' };
const autreAgent = { userId: 8, role: 'SPERS_AGENT' };
const chef = { userId: 7, role: 'SPERS_CHEF' };

describe('documentActions', () => {
  it('lets only the author validate a draft, and the author or a chief cancel it', () => {
    const brouillon = { statut: 'BROUILLON', auteurId: 5 };
    expect(documentActions(brouillon, auteur)).toEqual({ valider: true, annuler: true, archiver: false });
    expect(documentActions(brouillon, chef)).toEqual({ valider: false, annuler: true, archiver: false });
    expect(documentActions(brouillon, autreAgent)).toEqual({ valider: false, annuler: false, archiver: false });
  });

  it('lets a chief validate a draft whose author is unknown', () => {
    expect(documentActions({ statut: 'BROUILLON', auteurId: null }, chef).valider).toBe(true);
    expect(documentActions({ statut: 'BROUILLON', auteurId: null }, autreAgent).valider).toBe(false);
  });

  it('archives only a validated or cancelled document', () => {
    expect(documentActions({ statut: 'VALIDE', auteurId: 5 }, autreAgent).archiver).toBe(true);
    expect(documentActions({ statut: 'ANNULE', auteurId: 5 }, autreAgent).archiver).toBe(true);
    expect(documentActions({ statut: 'ARCHIVE', auteurId: 5 }, auteur))
      .toEqual({ valider: false, annuler: false, archiver: false });
  });
});
