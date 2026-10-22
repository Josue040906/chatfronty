// Runtime validation coverage for Bandy's authenticated conversation API.
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const sessionStorage = new Map();

let api;

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('VITE_BANDY_API_URL', 'https://bandy.example');
  vi.stubGlobal('localStorage', {
    getItem: (key) => sessionStorage.get(key) ?? null,
    setItem: (key, value) => sessionStorage.set(key, value),
    removeItem: (key) => sessionStorage.delete(key),
  });
  sessionStorage.set('user', JSON.stringify({ accessToken: 'test-session-token' }));
  api = await import('./assistant.js');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  sessionStorage.clear();
});

describe('Bandy conversation API', () => {
  it('creates a conversation with the configured URL and session Bearer token', async () => {
    const conversation = { id: 'conversation-1' };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(conversation));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.createConversation()).resolves.toEqual(conversation);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://bandy.example/api/conversations',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-session-token',
        }),
      })
    );
  });

  it('uses Bandy pagination defaults and the maximum message page size', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ items: [], page: 0, size: 20, total: 0 }))
      .mockResolvedValueOnce(jsonResponse({
        conversationId: 'conversation-1',
        items: [],
        page: 1,
        size: 100,
        total: 100,
      }));
    vi.stubGlobal('fetch', fetchMock);

    await api.listConversations();
    await api.listConversationMessages('conversation-1', 1);

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://bandy.example/api/conversations?page=0&size=20'
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://bandy.example/api/conversations/conversation-1/messages?page=1&size=100'
    );
  });

  it('sends the message body and UUID idempotency key without replacing the request', async () => {
    const response = { conversationId: 'conversation-1', message: 'Réponse Bandy' };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(response));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.sendConversationMessage(
      'conversation-1',
      'Question RH',
      '6f1f4c16-2c0d-4cd2-a702-5fd05011b707'
    )).resolves.toEqual(response);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://bandy.example/api/conversations/conversation-1/messages',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'Question RH' }),
        headers: expect.objectContaining({
          Authorization: 'Bearer test-session-token',
          'Idempotency-Key': '6f1f4c16-2c0d-4cd2-a702-5fd05011b707',
        }),
      })
    );
  });

  it.each([
    [401, 'Votre session a expiré. Reconnectez-vous pour continuer.'],
    [403, 'Bandy a refusé l’accès à cette ressource.'],
  ])('reports HTTP %i authentication errors explicitly', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, status)));

    await expect(api.listConversations()).rejects.toMatchObject({
      message,
      status,
    });
  });

  it('reports network failures instead of presenting an empty response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(api.listConversations()).rejects.toThrow(
      'Impossible de joindre Bandy.'
    );
  });

  it('aborts a message request at its configured timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      });
    })));

    const request = api.sendConversationMessage(
      'conversation-1',
      'Question RH',
      '6f1f4c16-2c0d-4cd2-a702-5fd05011b707'
    );
    const assertion = expect(request).rejects.toThrow(
      'Le délai de réponse de Bandy est dépassé.'
    );
    await vi.advanceTimersByTimeAsync(35_000);
    await assertion;
  });

  it('rejects malformed idempotency keys before issuing a network request', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(() => api.sendConversationMessage(
      'conversation-1',
      'Question RH',
      'not-a-uuid'
    )).toThrow('Idempotency-Key doit être un UUID.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
