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

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
});

describe('pièces scannées API', () => {
  it('deposits the original on its target with the RH session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ id: 8 }, 201));
    vi.stubGlobal('fetch', fetchMock);
    const { deposerPieceScannee } = await import('./piecesScannees');
    const scan = new File(['%PDF-1.7'], 'demande.pdf', { type: 'application/pdf' });

    await expect(deposerPieceScannee('DOCUMENT', 12, scan)).resolves.toEqual({ id: 8 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/pieces-scannees');
    expect(init.method).toBe('POST');
    expect(init.body.get('cibleType')).toBe('DOCUMENT');
    expect(init.body.get('cibleId')).toBe('12');
    expect(init.body.get('file').name).toBe('demande.pdf');
  });

  it('lists the pieces of a target, and nothing for an unexpected answer', async () => {
    const pieces = [{ id: 8, nom_fichier: 'diplome.jpg' }];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(pieces))
      .mockResolvedValueOnce(json({ autre: true }));
    vi.stubGlobal('fetch', fetchMock);
    const { listerPiecesScannees } = await import('./piecesScannees');

    await expect(listerPiecesScannees('DIPLOME', 17)).resolves.toEqual(pieces);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/pieces-scannees?cibleType=DIPLOME&cibleId=17');
    await expect(listerPiecesScannees('DIPLOME', 17)).resolves.toEqual([]);
  });
});
