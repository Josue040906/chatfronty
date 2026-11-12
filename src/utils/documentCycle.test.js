import { describe, expect, it } from 'vitest';
import {
  APPLICABLE, delaiLabel, documentActions, documentEffect, documentPhase, formatJours, joursConge, joursJusqua,
} from './documentCycle';

const today = '2026-11-10';
const auteur = { userId: 5, role: 'SPERS_AGENT' };
const autreAgent = { userId: 8, role: 'SPERS_AGENT' };
const chef = { userId: 7, role: 'SPERS_CHEF' };

describe('documentPhase', () => {
  it('an accepted request waits for its granted date, then becomes applicable and stays so', () => {
    expect(documentPhase({ statut: 'ACCEPTE', dateEffet: '2026-11-22' }, today))
      .toEqual({ code: 'EN_ATTENTE', label: 'Accepté', jours: 12 });
    expect(documentPhase({ statut: 'ACCEPTE', dateEffet: '2026-11-10' }, today).code).toBe(APPLICABLE);
    expect(documentPhase({ statut: 'ACCEPTE', dateEffet: '2025-01-01' }, today).code).toBe(APPLICABLE);
    expect(documentPhase({ statut: 'CREE', dateEffet: '2025-01-01' }, today).label).toBe('Sans réponse');
    expect(documentPhase({ statut: 'APPLIQUE' }, today).label).toBe('Appliqué');
  });
});

describe('documentActions', () => {
  it('lets any staff member record the paper answer of a created request', () => {
    const creee = { statut: 'CREE', auteurId: 5, dateEffet: '2026-12-01' };
    expect(documentActions(creee, autreAgent, today))
      .toEqual({ repondre: true, appliquer: false, appliquerPlusTard: false, annuler: false, archiver: false });
    expect(documentActions(creee, auteur, today).annuler).toBe(true);
    expect(documentActions(creee, chef, today).annuler).toBe(true);
    expect(documentActions(creee, { userId: 9, role: 'AGENT' }, today).repondre).toBe(false);
  });

  it('lets any staff member apply an accepted request once its granted date is reached', () => {
    const attente = { statut: 'ACCEPTE', auteurId: 5, dateEffet: '2026-12-01' };
    expect(documentActions(attente, autreAgent, today))
      .toEqual({ repondre: false, appliquer: false, appliquerPlusTard: true, annuler: false, archiver: false });
    expect(documentActions({ ...attente, dateEffet: '2026-11-01' }, autreAgent, today).appliquer).toBe(true);
  });

  it('archives only an applied, refused or cancelled request', () => {
    expect(documentActions({ statut: 'APPLIQUE', auteurId: 5 }, autreAgent, today).archiver).toBe(true);
    expect(documentActions({ statut: 'REFUSE', auteurId: 5 }, autreAgent, today).archiver).toBe(true);
    expect(documentActions({ statut: 'ANNULE', auteurId: 5 }, autreAgent, today).archiver).toBe(true);
    expect(documentActions({ statut: 'ARCHIVE', auteurId: 5 }, auteur, today).archiver).toBe(false);
  });
});

describe('documentEffect', () => {
  it('shows the grade before and after an advancement', () => {
    const effet = documentEffect({ donnees: {
      situationActuelle: { classeLibelle: '2e classe', echelonOrdre: 1 },
      situationDemandee: { classeLibelle: '2e classe', echelonOrdre: 2 },
    } }, 'AVANCEMENT');
    expect(effet).toEqual({ titre: 'Avancement', avant: ['2e classe · échelon 1'], apres: ['2e classe · échelon 2'] });
  });

  it('shows only what a transfer changes', () => {
    const effet = documentEffect({ donnees: {
      situationActuelle: { service: 'Paie', poste: 'Agent', lieuTravail: 'Antananarivo' },
      situationDemandee: { lieuTravail: 'Toamasina' },
    } }, 'MUTATION');
    expect(effet.avant).toEqual(['Lieu : Antananarivo']);
    expect(effet.apres).toEqual(['Lieu : Toamasina']);
  });
});

describe('delays', () => {
  it('counts days and says them plainly', () => {
    expect(joursJusqua('2026-11-13', today)).toBe(3);
    expect(delaiLabel(1)).toBe('demain');
    expect(delaiLabel(12)).toBe('dans 12 jours');
  });
});

describe('leave', () => {
  it('counts calendar days, first and last included', () => {
    expect(joursConge('2026-12-10', '2026-12-12')).toBe(3);
    expect(joursConge('2026-12-12', '2026-12-10')).toBe(0);
    expect(formatJours(17.5)).toBe('17,5');
  });

  it('shows the absence and the days taken from the balance', () => {
    expect(documentEffect({ donnees: { dateDebut: '2026-12-10', dateFin: '2026-12-12' } }, 'CONGE').apres)
      .toEqual(['Absent du 10/12/2026 au 12/12/2026', '3 jours déduits du solde']);
  });
});

describe('titularisation', () => {
  it('shows the employment type, grade and indice before and after', () => {
    expect(documentEffect({ donnees: {
      situationActuelle: { typeEmploi: 'Agent contractuel', gradeCode: 'A19E', indice: 520 },
      situationDemandee: { typeEmploi: 'Fonctionnaire', gradeCode: '2C2E', indice: 530 },
    } }, 'TITULARISATION')).toEqual({
      titre: 'Titularisation',
      avant: ['Agent contractuel · A19E', 'Indice 520'],
      apres: ['Fonctionnaire · 2C2E', 'Indice 530'],
    });
  });
});
