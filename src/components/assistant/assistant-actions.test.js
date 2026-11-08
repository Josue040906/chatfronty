import { describe, expect, it } from 'vitest';
import {
  buildBandyReply,
  confirmationOutcomeMessage,
  getConfirmationActions,
  getFilteredListAction,
  getNavigationActions,
  getPreparedActions,
  getStatistics,
  getTodoItems,
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

describe('getTodoItems', () => {
  it('keeps what the RH API listed, in its order', () => {
    expect(getTodoItems([
      { code: 'documents_brouillon', libelle: 'Documents en brouillon', nombre: 6, route: '/documents' },
      { code: 'dossiers_incomplets', libelle: 'Dossiers d’agents incomplets', nombre: 24, route: '/agents' },
    ])).toEqual([
      { label: 'Documents en brouillon', count: 6, route: '/documents' },
      { label: 'Dossiers d’agents incomplets', count: 24, route: '/agents' },
    ]);
  });

  it('never follows an external route and drops empty or malformed items', () => {
    expect(getTodoItems([
      { libelle: 'Piège', nombre: 1, route: 'https://evil.test' },
      { libelle: 'Zéro', nombre: 0, route: '/documents' },
      { libelle: ' ', nombre: 2, route: '/documents' },
      { libelle: 'Décimal', nombre: 1.5, route: '/documents' },
      null,
    ])).toEqual([]);
    expect(getTodoItems(undefined)).toEqual([]);
  });
});

describe('getFilteredListAction', () => {
  const criteria = { must: [{ field: 'sexe', operator: 'EQ', value: 'F' }], limit: 20, offset: 0 };
  const search = (total, agents = [], resultMode) => ({
    name: 'search_agents',
    arguments: { criteriaJson: JSON.stringify(criteria), ...(resultMode ? { resultMode } : {}) },
    result: { total, agents },
  });
  const agent = (id, score = null) => ({ id, nom: `NOM${id}`, prenom: 'Zo', score_correspondance: score });

  it('opens the agents page restricted to the same criteria beyond four filtered agents', () => {
    const action = getFilteredListAction([search(12, [agent(1), agent(2)])]);

    expect(action.label).toBe('Voir les 12 agents dans la liste');
    const [path, query] = action.route.split('?');
    expect(path).toBe('/agents');
    expect(JSON.parse(new URLSearchParams(query).get('recherche')))
      .toEqual({ must: criteria.must });
    expect(isInternalRoute(action.route)).toBe(true);
  });

  it('also offers the list after a count', () => {
    expect(getFilteredListAction([search(7, [], 'COUNT')])?.label).toBe('Voir les 7 agents dans la liste');
  });

  it('keeps cards for four agents or fewer, and for a name search with similarity scores', () => {
    expect(getFilteredListAction([search(4, [agent(1), agent(2), agent(3), agent(4)])])).toBeNull();
    expect(getFilteredListAction([search(6, [agent(1, 1), agent(2, 0.6)])])).toBeNull();
  });

  it('links a filtered statistic to its agents, but not a statistic on everyone', () => {
    const grouped = { ...search(16), arguments: {
      resultMode: 'GROUP',
      criteriaJson: JSON.stringify({ must: criteria.must, groupBy: ['categorie'] }),
    } };
    const action = getFilteredListAction([grouped]);
    expect(JSON.parse(new URLSearchParams(action.route.split('?')[1]).get('recherche')))
      .toEqual({ must: criteria.must });

    expect(getFilteredListAction([{ ...search(33), arguments: {
      resultMode: 'GROUP', criteriaJson: JSON.stringify({ groupBy: ['direction'] }),
    } }])).toBeNull();
  });

  it('ignores unreadable criteria', () => {
    expect(getFilteredListAction([{ ...search(9), arguments: { criteriaJson: '{oups' } }])).toBeNull();
  });

  it('replaces the cards in the Bandy reply', () => {
    const reply = buildBandyReply({ toolResults: [search(5, [1, 2, 3, 4, 5].map((id) => agent(id)))] });

    expect(reply.agents).toEqual([]);
    expect(reply.navigation.map(({ label }) => label)).toEqual(['Voir les 5 agents dans la liste']);
  });
});

describe('getStatistics', () => {
  const grouped = (groupes, total = 33) => [{ name: 'search_agents', arguments: { resultMode: 'GROUP' }, result: { total, agents: [], groupes } }];

  it('turns an API breakdown into a table, as received', () => {
    expect(getStatistics(grouped([
      { direction: 'Direction Financière', 'diplomes.niveau': 'Licence', nombre: 3, moyenne_age: 36.5 },
      { direction: 'Direction Financière', 'diplomes.niveau': null, nombre: 1, moyenne_age: 24 },
    ]))).toEqual({
      columns: ['Direction', 'Niveau (diplomes)', 'Agents', 'Moyenne age'],
      rows: [
        ['Direction Financière', 'Licence', '3', '36.5'],
        ['Direction Financière', 'Non renseigné', '1', '24'],
      ],
      hiddenRows: 0,
      total: 33,
    });
  });

  it('shows the first twenty groups and counts the others', () => {
    const groups = Array.from({ length: 23 }, (_, index) => ({ date_embauche: 2000 + index, nombre: 1 }));
    const table = getStatistics(grouped(groups));
    expect(table.rows).toHaveLength(20);
    expect(table.hiddenRows).toBe(3);
  });

  it('has no table without a breakdown', () => {
    expect(getStatistics([{ name: 'search_agents', result: { total: 4, agents: [] } }])).toBeNull();
    expect(getStatistics(undefined)).toBeNull();
    expect(buildBandyReply({ toolResults: grouped([{ sexe: 'F', nombre: 16 }]) }).statistics.rows)
      .toEqual([['F', '16']]);
  });
});
