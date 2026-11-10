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

describe('documents API', () => {
  it('asks the server for the PDF preview of a request being typed', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Blob(['%PDF-1.7']), {
      status: 200, headers: { 'Content-Type': 'application/pdf' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { previewDocumentRequestPdf } = await import('./documents');
    const request = { typeDocumentId: 3, employeId: 28, destinataire: 'DRH', donnees: { dateDebut: '2026-12-01' } };

    const pdf = await previewDocumentRequestPdf(request);

    expect(await pdf.text()).toBe('%PDF-1.7');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/documents/demandes/apercu-pdf');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(request);
  });

  it('surfaces the validation message when the request is not complete yet', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ message: 'Les dates de début et de fin du congé sont obligatoires.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )));
    const { previewDocumentRequestPdf } = await import('./documents');

    await expect(previewDocumentRequestPdf({ typeDocumentId: 3, employeId: 28, destinataire: 'DRH', donnees: {} }))
      .rejects.toThrow('Les dates de début et de fin du congé sont obligatoires.');
  });
});
