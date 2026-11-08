import { describe, expect, it } from 'vitest';
import {
  buildBandyReply,
  confirmationOutcomeMessage,
  getConfirmationActions,
  getNavigationActions,
  getPreparedActions,
  isInternalRoute,
} from './assistant-actions';

describe('getConfirmationActions', () => {
  const id = '7f1c2a9e-1b2c-4d3e-8f90-123456789abc';

  it('summarises what will be sent, pending the user click', () => {
    expect(getConfirmationActions([{
      type: 'CONFIRM',
      tool: 'submit_leave_request',
      confirmationId: id,
      fields: { motif: 'Congé annuel', dateEffetSouhaitee: '2026-12-01', nombreJours: 5 },
    }])).toEqual([{
      confirmationId: id,
      status: 'pending',
      outcome: '',
      details: [
        { label: 'Motif', value: 'Congé annuel' },
        { label: 'Date effet souhaitee', value: '2026-12-01' },
        { label: 'Nombre jours', value: '5' },
      ],
    }]);
  });

  it('ignores a confirmation without a valid identifier', () => {
    expect(getConfirmationActions([
      { type: 'CONFIRM', confirmationId: 'pas-un-uuid', fields: {} },
      { type: 'CONFIRM', fields: { motif: 'x' } },
      { type: 'NAVIGATE', route: '/agents' },
    ])).toEqual([]);
  });

  it('explains the outcome returned by Bandy', () => {
    expect(confirmationOutcomeMessage({ status: 'CONFIRMED', result: {} }))
      .toBe('Action confirmée et exécutée.');
    expect(confirmationOutcomeMessage({
      status: 'FAILED',
      result: { ok: false, status: 403, message: { code: 'FORBIDDEN', message: 'Droits insuffisants.' } },
    })).toBe('Action refusée : Droits insuffisants.');
    expect(confirmationOutcomeMessage({ status: 'FAILED', result: { message: 'Type inconnu.' } }))
      .toBe('Action refusée : Type inconnu.');
    expect(confirmationOutcomeMessage({ status: 'FAILED' }))
      .toBe('Action refusée par le service RH.');
  });
});

describe('getPreparedActions', () => {
  it('keeps the proposed fields and labels the form to open', () => {
    expect(getPreparedActions([
      { type: 'PREPARE', route: '/agents/101', fields: { telephone: '034 12 345 67' } },
      { type: 'PREPARE', route: '/documents/nouveau', fields: { typeDocumentId: 1, employeId: 101 } },
    ])).toEqual([
      {
        route: '/agents/101',
        fields: { telephone: '034 12 345 67' },
        label: 'Ouvrir la modification préremplie',
      },
      {
        route: '/documents/nouveau',
        fields: { typeDocumentId: 1, employeId: 101 },
        label: 'Ouvrir le nouveau document prérempli',
      },
    ]);
  });

  it('ignores external routes, empty or invalid fields and other types', () => {
    expect(getPreparedActions([
      { type: 'PREPARE', route: '//evil.test/x', fields: { a: 1 } },
      { type: 'PREPARE', route: '/agents/1', fields: {} },
      { type: 'PREPARE', route: '/agents/1', fields: ['a'] },
      { type: 'NAVIGATE', route: '/agents/1' },
    ])).toEqual([]);
  });
});

describe('getNavigationActions', () => {
  it('turns NAVIGATE actions into labelled internal routes', () => {
    expect(getNavigationActions([
      { type: 'NAVIGATE', tool: 'open_agent_record', route: '/agents/101' },
      { type: 'NAVIGATE', tool: 'open_page', route: '/activites' },
      { type: 'NAVIGATE', tool: 'open_page', route: '/documents' },
    ])).toEqual([
      { route: '/agents/101', label: 'Ouvrir la fiche de l’agent' },
      { route: '/activites', label: 'Ouvrir mes activités' },
      { route: '/documents', label: 'Ouvrir les documents' },
    ]);
  });

  it('never follows an external, protocol-relative or malformed route', () => {
    expect(getNavigationActions([
      { type: 'NAVIGATE', route: 'https://evil.test/agents' },
      { type: 'NAVIGATE', route: '//evil.test/agents' },
      { type: 'NAVIGATE', route: 'agents' },
      { type: 'NAVIGATE', route: '/agents\\..\\admin' },
      { type: 'NAVIGATE', route: '/a b' },
      { type: 'NAVIGATE' },
      null,
    ])).toEqual([]);
  });

  it('ignores other action types and duplicates', () => {
    expect(getNavigationActions([
      { type: 'PREPARE', route: '/agents/7', fields: { telephone: '034' } },
      { type: 'NAVIGATE', route: '/agents' },
      { type: 'NAVIGATE', route: '/agents' },
    ])).toEqual([
      { route: '/agents', label: 'Ouvrir la liste des agents' },
    ]);
  });

  it('names the agent on the button and keeps one button per agent', () => {
    expect(getNavigationActions([
      { type: 'NAVIGATE', route: '/agents/16?nom=Hery%20Randria' },
      { type: 'NAVIGATE', route: '/agents/18?nom=Haja%20Ramanana' },
      { type: 'NAVIGATE', route: '/agents/16' },
    ])).toEqual([
      { route: '/agents/16', label: 'Ouvrir la fiche de Hery Randria' },
      { route: '/agents/18', label: 'Ouvrir la fiche de Haja Ramanana' },
    ]);
  });

  it('takes the name from the search of the same turn when Bandy sent none', () => {
    expect(getNavigationActions(
      [{ type: 'NAVIGATE', route: '/agents/13' }, { type: 'NAVIGATE', route: '/agents/99' }],
      [{ id: '13', name: 'Tiana ANDRIAMIHARISOA' }],
    )).toEqual([
      { route: '/agents/13', label: 'Ouvrir la fiche de Tiana ANDRIAMIHARISOA' },
      { route: '/agents/99', label: 'Ouvrir la fiche de l’agent' },
    ]);
  });

  it('labels an unknown internal page generically', () => {
    expect(getNavigationActions([{ type: 'NAVIGATE', route: '/carrieres' }]))
      .toEqual([{ route: '/carrieres', label: 'Ouvrir la page' }]);
  });

  it('returns nothing when Bandy sent no actions', () => {
    expect(getNavigationActions(undefined)).toEqual([]);
    expect(isInternalRoute('/agents/1?onglet=carri%C3%A8re')).toBe(true);
  });
});

describe('buildBandyReply', () => {
  // Réponse réelle enregistrée par Bandy pour « change le téléphone de Toky… ».
  const searchCards = [{
    name: 'search_agents',
    result: {
      agents: [
        { id: 3, prenom: 'Toky', nom: 'RAZAFINDRAIBE', score_correspondance: 1 },
        { id: 9, prenom: 'Micka', nom: 'RAZAFINDRAKOTO', score_correspondance: 0.53 },
      ],
    },
  }];

  it('shows only the prepared task, not the intermediate search cards', () => {
    const reply = buildBandyReply({
      toolResults: searchCards,
      actions: [{
        type: 'PREPARE',
        tool: 'prepare_agent_update',
        route: '/agents/3',
        fields: { telephone: '034 12 345 67' },
      }],
    });

    expect(reply.agents).toEqual([]);
    expect(reply.prepared).toHaveLength(1);
    expect(reply.prepared[0].label).toBe('Ouvrir la modification préremplie');
  });

  it('shows only the proposed buttons when Bandy opens records it found', () => {
    const reply = buildBandyReply({
      toolResults: searchCards,
      actions: [{ type: 'NAVIGATE', tool: 'open_agent_record', route: '/agents/3' }],
    });

    expect(reply.agents).toEqual([]);
    expect(reply.navigation).toEqual([
      { route: '/agents/3', label: 'Ouvrir la fiche de Toky RAZAFINDRAIBE' },
    ]);
  });

  it('keeps the search cards for a plain search', () => {
    const reply = buildBandyReply({ toolResults: searchCards, actions: [] });

    // Micka (53 %) est trop loin de Toky (100 %) pour être proposé.
    expect(reply.agents.map((agent) => agent.id)).toEqual(['3']);
    expect(reply.prepared).toEqual([]);
  });
});
