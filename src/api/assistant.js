import { BANDY_API_URL, getAuthHeaders } from './client';

const CONVERSATIONS_URL = `${BANDY_API_URL}/api/conversations`;
const MESSAGE_PAGE_SIZE = 100;
const DEFAULT_TIMEOUT_MILLIS = 15_000;
const UUID_PATTERN = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

class BandyApiError extends Error {
  constructor(message, status, cause) {
    super(message, { cause });
    this.name = 'BandyApiError';
    this.status = status;
  }
}

async function request(
  path,
  {
    method = 'GET',
    body,
    headers = {},
    baseUrl = CONVERSATIONS_URL,
    signal,
    timeoutMillis = DEFAULT_TIMEOUT_MILLIS,
  } = {}
) {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMillis);
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener('abort', abortFromCaller, { once: true });
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...getAuthHeaders(),
        ...(body === undefined
          ? {}
          : { 'Content-Type': 'application/json; charset=utf-8' }),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : null;

    if (!response.ok) {
      const message = response.status === 401
        ? 'Votre session a expiré. Reconnectez-vous pour continuer.'
        : response.status === 403
          ? 'Bandy a refusé l’accès à cette ressource.'
          : response.status >= 500
            ? `Le service Bandy est indisponible (HTTP ${response.status}).`
            : data?.message
              || `Erreur Bandy ${response.status}: ${response.statusText}`;
      throw new BandyApiError(message, response.status);
    }

    return data;
  } catch (error) {
    if (timedOut) {
      throw new BandyApiError('Le délai de réponse de Bandy est dépassé.', null, error);
    }
    if (controller.signal.aborted || error instanceof BandyApiError) {
      throw error;
    }
    throw new BandyApiError(
      'Impossible de joindre Bandy. Vérifiez le service et votre connexion réseau.',
      null,
      error
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

export function listConversations(page = 0, size = 20, { signal } = {}) {
  return request(`?page=${page}&size=${size}`, { signal });
}

export function createConversation({ signal } = {}) {
  return request('', { method: 'POST', signal });
}

export function listConversationMessages(conversationId, page = 0, { signal } = {}) {
  return request(
    `/${encodeURIComponent(conversationId)}/messages?page=${page}&size=${MESSAGE_PAGE_SIZE}`,
    { signal }
  );
}

export function sendConversationMessage(
  conversationId,
  message,
  idempotencyKey,
  { signal } = {}
) {
  if (!UUID_PATTERN.test(idempotencyKey || '')) {
    throw new Error('Idempotency-Key doit être un UUID.');
  }
  return request(`/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: { message },
    headers: { 'Idempotency-Key': idempotencyKey },
    signal,
    timeoutMillis: 35_000,
  });
}

export { MESSAGE_PAGE_SIZE };
