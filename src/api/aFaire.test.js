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

describe('à faire API', () => {
  it('reads the elements of the connected user with the RH session', async () => {
    const elements = [{ code: 'documents_brouillon', libelle: 'Documents en brouillon', nombre: 6, route: '/documents' }];
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ elements }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ));
    vi.stubGlobal('fetch', fetchMock);
    const { getAFaire } = await import('./aFaire');

    await expect(getAFaire()).resolves.toEqual(elements);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/a-faire'),
      expect.objectContaining({ headers: { Authorization: expect.stringMatching(/^Bearer /) } }),
    );
  });

  it('returns an empty list for an unexpected answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ autre: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )));
    const { getAFaire } = await import('./aFaire');

    await expect(getAFaire()).resolves.toEqual([]);
  });
});
