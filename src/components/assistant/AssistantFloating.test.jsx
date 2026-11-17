import { describe, expect, it } from 'vitest';
import { getNavigableAgents } from './assistant-agents';

describe('getNavigableAgents', () => {
  it('returns the approximate-search score as a percentage for real candidates', () => {
    expect(getNavigableAgents([{
      name: 'search_agents',
      result: {
        agents: [{
          id: 42,
          prenom: 'Miora',
          nom: 'RAKOTO',
          poste: 'Gestionnaire',
          service: 'Finances',
          type_emploi: 'Agent contractuel',
          score_correspondance: 0.87,
        }],
      },
    }])).toEqual([{
      id: '42',
      name: 'Miora RAKOTO',
      meta: 'Gestionnaire · Finances',
      reason: '',
      typeEmploi: 'Agent contractuel',
      similarityPercent: 87,
    }]);
  });

  it('says on one line why the API kept the agent', () => {
    const [agent] = getNavigableAgents([{
      name: 'search_agents',
      result: {
        agents: [{
          id: 7,
          prenom: 'Zo',
          nom: 'RABARISON',
          score_correspondance: null,
          correspondance: { diplomes: 'Licence Informatique (Université d’Antananarivo, 2017)', age: 36, vide: '' },
        }],
      },
    }]);

    expect(agent.reason).toBe('Licence Informatique (Université d’Antananarivo, 2017) · 36');
  });

  it('keeps only the agent the answer examines when a search served to find it', () => {
    const recherche = {
      name: 'search_agents',
      result: { agents: [{ id: 94, prenom: 'Ony', nom: 'R' }, { id: 95, prenom: 'Tsiry', nom: 'R' }] },
    };
    const noms = (outils) => getNavigableAgents(outils).map(({ name }) => name);

    expect(noms([recherche])).toEqual(['Ony R', 'Tsiry R']);
    expect(noms([recherche, { name: 'check_titularisation', arguments: { agentId: 95 }, result: {} }])).toEqual(['Tsiry R']);
    expect(noms([recherche, { name: 'get_agent_profile', arguments: { query: 'Tsiry' }, result: { id: 95 } }])).toEqual(['Tsiry R']);
    expect(noms([recherche, { name: 'simulate_career', arguments: { agentId: 7 }, result: {} }])).toEqual(['Ony R', 'Tsiry R']);
  });

  it('does not repeat in the reason what the row already shows', () => {
    const [agent] = getNavigableAgents([{
      name: 'search_agents',
      result: {
        agents: [{
          id: 8,
          prenom: 'Lina',
          nom: 'ANDRIATSILAVINA',
          poste: 'Chef de service',
          service: 'Service Juridique',
          type_emploi: 'Fonctionnaire',
          correspondance: { service: 'SJUR Service Juridique', type: 'Fonctionnaire', categorie: 'A' },
        }],
      },
    }]);

    expect(agent.reason).toBe('A');
  });

  it('keeps every approximate candidate, but only near ones beside an exact match', () => {
    const candidate = (id, score) => ({ id, prenom: 'P', nom: `N${id}`, score_correspondance: score });
    const shown = (scores) => getNavigableAgents([{
      name: 'search_agents',
      result: { agents: scores.map((score, index) => candidate(index + 1, score)) },
    }]).map((agent) => agent.similarityPercent);

    expect(shown([1, 0.44, 0.32])).toEqual([100]);
    expect(shown([1, 0.9, 0.5])).toEqual([100, 90]);
    expect(shown([0.7, 0.62, 0.3])).toEqual([70, 62, 30]);
    expect(shown([null, null])).toEqual([null, null]);
  });

  it('does not invent a percentage when the backend score is missing or invalid', () => {
    const agents = getNavigableAgents([{
      name: 'search_agents',
      result: {
        agents: [{
          id: 42,
          prenom: 'Miora',
          nom: 'RAKOTO',
          score_correspondance: 87,
        }],
      },
    }]);

    expect(agents[0].similarityPercent).toBeNull();
  });
});
