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

  it('rejects calls without an RH session before contacting Bandy', async () => {
    sessionStorage.delete('user');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.createConversation()).rejects.toMatchObject({
      message: 'Connectez-vous à votre compte RH pour utiliser Bandy.',
      status: 401,
    });
    expect(fetchMock).not.toHaveBeenCalled();
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

  it('renames and permanently deletes an owned conversation through Bandy', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.renameConversation('conversation-1', 'Suivi carrière'))
      .resolves.toBeNull();
    await expect(api.deleteConversation('conversation-1')).resolves.toBeNull();

    expect(fetchMock.mock.calls.map(([url, options]) => ({
      url,
      method: options.method,
      body: options.body,
    }))).toEqual([
      {
        url: 'https://bandy.example/api/conversations/conversation-1',
        method: 'PATCH',
        body: JSON.stringify({ label: 'Suivi carrière' }),
      },
      {
        url: 'https://bandy.example/api/conversations/conversation-1',
        method: 'DELETE',
        body: undefined,
      },
    ]);
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
      'https://bandy.example/api/conversations/conversation-1/messages/stream',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'Question RH' }),
        headers: expect.objectContaining({
          Authorization: 'Bearer test-session-token',
          'Idempotency-Key': '6f1f4c16-2c0d-4cd2-a702-5fd05011b707',
        }),
      })
    );
    expect(fetchMock.mock.calls[0][1].headers.Accept).toBe('text/event-stream');
  });

  it('consumes server-sent tokens and returns the final response event', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response([
      'event: token',
      'data: {"text":"Bonjour"}',
      '',
      'event: token',
      'data: {"text":" !"}',
      '',
      'event: done',
      'data: {"conversationId":"conversation-1","message":"Bonjour !","toolResults":[]}',
      '',
      '',
    ].join('\n'), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    }));
    const onToken = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.sendConversationMessage(
      'conversation-1',
      'Bonjour',
      '6f1f4c16-2c0d-4cd2-a702-5fd05011b707',
      { onToken }
    )).resolves.toMatchObject({
      message: 'Bonjour !',
      conversationId: 'conversation-1',
    });

    expect(onToken.mock.calls).toEqual([['Bonjour'], [' !']]);
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

  it('signals the auth provider when Bandy rejects an expired RH session', async () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 401)));

    await expect(api.listConversations()).rejects.toMatchObject({
      status: 401,
    });

    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth:session-expired' })
    );
  });

  it('reuses the same conversation for follow-up messages', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        conversationId: 'conversation-1',
        message: 'Première réponse',
      }))
      .mockResolvedValueOnce(jsonResponse({
        conversationId: 'conversation-1',
        message: 'Réponse de suivi',
      }));
    vi.stubGlobal('fetch', fetchMock);

    await api.sendConversationMessage(
      'conversation-1',
      'Question initiale',
      '6f1f4c16-2c0d-4cd2-a702-5fd05011b707'
    );
    await api.sendConversationMessage(
      'conversation-1',
      'Question de suivi',
      'e8b9a1bb-5b48-4f07-9f37-31c2ed9ced1b'
    );

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://bandy.example/api/conversations/conversation-1/messages/stream',
      'https://bandy.example/api/conversations/conversation-1/messages/stream',
    ]);
    expect(fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body).message))
      .toEqual(['Question initiale', 'Question de suivi']);
  });

  it('reports server errors and malformed JSON responses explicitly', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(new Response('{', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })));

    await expect(api.listConversations()).rejects.toMatchObject({
      message: 'Le service Bandy est indisponible (HTTP 503).',
      status: 503,
    });
    await expect(api.listConversations()).rejects.toMatchObject({
      message: 'Bandy a renvoyé une réponse JSON invalide.',
      status: 200,
    });
  });

  it('preserves the actionable quota message from Bandy', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      status: 429,
      message: 'Gemini a refusé la requête : quota ou limite de débit atteint.',
    }, 429)));

    await expect(api.listConversations()).rejects.toMatchObject({
      status: 429,
      message: 'Gemini a refusé la requête : quota ou limite de débit atteint.',
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
