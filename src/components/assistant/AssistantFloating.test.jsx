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
          score_correspondance: 0.87,
        }],
      },
    }])).toEqual([{
      id: '42',
      name: 'Miora RAKOTO',
      meta: 'Gestionnaire · Finances',
      similarityPercent: 87,
    }]);
  });

  it('shows only the candidates close to the best score', () => {
    const candidate = (id, score) => ({ id, prenom: 'P', nom: `N${id}`, score_correspondance: score });
    const shown = (scores) => getNavigableAgents([{
      name: 'search_agents',
      result: { agents: scores.map((score, index) => candidate(index + 1, score)) },
    }]).map((agent) => agent.similarityPercent);

    expect(shown([1, 0.44, 0.32])).toEqual([100]);
    expect(shown([0.7, 0.62, 0.3])).toEqual([70, 62]);
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
