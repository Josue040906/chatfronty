import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map();

beforeEach(() => {
  vi.stubGlobal('localStorage', { getItem: (key) => storage.get(key) ?? null });
  storage.set('user', JSON.stringify({ accessToken: 'test-session-token' }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  storage.clear();
});

const page = (ids, hasMore) => new Response(
  JSON.stringify({ total: 60, agents: ids.map((id) => ({ id })), hasMore }),
  { status: 200, headers: { 'Content-Type': 'application/json' } },
);

describe('searchAgentIds', () => {
  it('replays the criteria page after page and keeps every identifier', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(page([1, 2], true))
      .mockResolvedValueOnce(page([3], false));
    vi.stubGlobal('fetch', fetchMock);
    const { searchAgentIds } = await import('./agents');

    await expect(searchAgentIds('{"must":[{"field":"sexe","operator":"EQ","value":"F"}]}'))
      .resolves.toEqual(['1', '2', '3']);

    const bodies = fetchMock.mock.calls.map(([, init]) => JSON.parse(JSON.parse(init.body).criteriaJson));
    expect(fetchMock.mock.calls[0][0]).toContain('/api/recherche/agents/avancee');
    expect(bodies.map(({ limit, offset }) => [limit, offset])).toEqual([[50, 0], [50, 50]]);
    expect(bodies[1].must).toEqual([{ field: 'sexe', operator: 'EQ', value: 'F' }]);
  });

  it('rejects unreadable criteria without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { searchAgentIds } = await import('./agents');

    await expect(searchAgentIds('{oups')).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
