import { describe, expect, it } from 'vitest';
import { getNavigableAgents } from './assistant-agents';

describe('getNavigableAgents', () => {
  it('returns the approximate-search score as a percentage for real candidates', () => {
    expect(getNavigableAgents([{
      name: 'searchEmployeesApproximately',
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

  it('does not invent a percentage when the backend score is missing or invalid', () => {
    const agents = getNavigableAgents([{
      name: 'searchEmployeesApproximately',
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
