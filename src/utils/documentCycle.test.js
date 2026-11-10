import { describe, expect, it } from 'vitest';
import {
  APPLICABLE, delaiLabel, documentActions, documentEffect, documentPhase, formatJours, joursConge, joursJusqua,
} from './documentCycle';

const today = '2026-11-10';
const auteur = { userId: 5, role: 'SPERS_AGENT' };
const autreAgent = { userId: 8, role: 'SPERS_AGENT' };
const chef = { userId: 7, role: 'SPERS_CHEF' };

describe('documentPhase', () => {
  it('a created request waits for its effect date, then becomes applicable and stays so', () => {
    expect(documentPhase({ statut: 'CREE', dateEffet: '2026-11-22' }, today))
      .toEqual({ code: 'EN_ATTENTE', label: 'Créé', jours: 12 });
    expect(documentPhase({ statut: 'CREE', dateEffet: '2026-11-10' }, today).code).toBe(APPLICABLE);
    expect(documentPhase({ statut: 'CREE', dateEffet: '2025-01-01' }, today).code).toBe(APPLICABLE);
    expect(documentPhase({ statut: 'APPLIQUE' }, today).label).toBe('Appliqué');
  });
});

describe('documentActions', () => {
  it('lets only the author apply, once the effect date is reached', () => {
    const attente = { statut: 'CREE', auteurId: 5, dateEffet: '2026-12-01' };
    expect(documentActions(attente, auteur, today))
      .toEqual({ appliquer: false, appliquerPlusTard: true, annuler: true, archiver: false });
    const prete = { ...attente, dateEffet: '2026-11-01' };
    expect(documentActions(prete, auteur, today).appliquer).toBe(true);
    expect(documentActions(prete, chef, today)).toEqual(
      { appliquer: false, appliquerPlusTard: false, annuler: true, archiver: false });
    expect(documentActions(prete, autreAgent, today).annuler).toBe(false);
  });

  it('lets a chief apply a request whose author is unknown', () => {
    expect(documentActions({ statut: 'CREE', auteurId: null, dateEffet: today }, chef, today).appliquer).toBe(true);
  });

  it('archives only an applied or cancelled request', () => {
    expect(documentActions({ statut: 'APPLIQUE', auteurId: 5 }, autreAgent, today).archiver).toBe(true);
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
