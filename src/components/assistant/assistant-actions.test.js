import { describe, expect, it } from 'vitest';
import { getNavigationActions, isInternalRoute } from './assistant-actions';

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

  it('ignores other action types and duplicates, and an agent card already shown', () => {
    expect(getNavigationActions([
      { type: 'PREPARE', route: '/agents/7', fields: { telephone: '034' } },
      { type: 'NAVIGATE', route: '/agents/7' },
      { type: 'NAVIGATE', route: '/agents' },
      { type: 'NAVIGATE', route: '/agents' },
    ], ['7'])).toEqual([
      { route: '/agents', label: 'Ouvrir la liste des agents' },
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
