import {
  BANDY_API_URL,
  getAuthHeaders,
  notifySessionExpired,
} from './client';

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
    onToken,
  } = {}
) {
  const authHeaders = getAuthHeaders();
  if (!authHeaders.Authorization) {
    throw new BandyApiError(
      'Connectez-vous à votre compte RH pour utiliser Bandy.',
      401
    );
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMillis);
  const requestId = headers['Idempotency-Key'];
  const isMessageSend = method === 'POST'
    && path.includes('/messages')
    && Boolean(requestId);
  const startedAt = isMessageSend ? performance.now() : null;
  let requestStatus = null;
  let requestOutcome = 'network_error';
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
        ...authHeaders,
        ...(body === undefined
          ? {}
          : { 'Content-Type': 'application/json; charset=utf-8' }),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
    requestStatus = response.status;

    const contentType = response.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('text/event-stream')) {
      data = await readEventStream(response.body, onToken);
    } else if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (error) {
        throw new BandyApiError(
          'Bandy a renvoyé une réponse JSON invalide.',
          response.status,
          error
        );
      }
    }

    if (!response.ok) {
      requestOutcome = 'http_error';
      if (response.status === 401) {
        notifySessionExpired();
      }
      const message = response.status === 401
        ? 'Votre session a expiré. Reconnectez-vous pour continuer.'
        : response.status === 403
          ? 'Bandy a refusé l’accès à cette ressource.'
          : data?.message
            || (response.status >= 500
              ? `Le service Bandy est indisponible (HTTP ${response.status}).`
              : `Erreur Bandy ${response.status}: ${response.statusText}`);
      throw new BandyApiError(message, response.status);
    }

    requestOutcome = 'success';
    return data;
  } catch (error) {
    if (timedOut) {
      requestOutcome = 'timeout';
      throw new BandyApiError('Le délai de réponse de Bandy est dépassé.', null, error);
    }
    if (controller.signal.aborted || error instanceof BandyApiError) {
      if (controller.signal.aborted) {
        requestOutcome = 'cancelled';
      } else if (requestStatus !== null) {
        requestOutcome = 'response_error';
      }
      throw error;
    }
    throw new BandyApiError(
      'Impossible de joindre Bandy. Vérifiez le service et votre connexion réseau.',
      null,
      error
    );
  } finally {
    if (isMessageSend && import.meta.env.DEV) {
      console.info('bandy_frontend event=assistant_message', {
        request_id: requestId,
        duration_ms: Math.round(performance.now() - startedAt),
        status: requestStatus,
        outcome: requestOutcome,
      });
    }
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

export function renameConversation(conversationId, label, { signal } = {}) {
  return request(`/${encodeURIComponent(conversationId)}`, {
    method: 'PATCH',
    body: { label },
    signal,
  });
}

export function deleteConversation(conversationId, { signal } = {}) {
  return request(`/${encodeURIComponent(conversationId)}`, {
    method: 'DELETE',
    signal,
  });
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
  { signal, onToken } = {}
) {
  if (!UUID_PATTERN.test(idempotencyKey || '')) {
    throw new Error('Idempotency-Key doit être un UUID.');
  }
  return request(`/${encodeURIComponent(conversationId)}/messages/stream`, {
    method: 'POST',
    body: { message },
    headers: {
      'Idempotency-Key': idempotencyKey,
      Accept: 'text/event-stream',
    },
    signal,
    onToken,
    timeoutMillis: 35_000,
  });
}

export { MESSAGE_PAGE_SIZE };

async function readEventStream(body, onToken) {
  if (!body) {
    throw new BandyApiError('Bandy n’a pas ouvert le flux de réponse.', null);
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completedResponse = null;

  function processFrame(frame) {
    let event = 'message';
    const dataLines = [];
    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
    if (dataLines.length === 0) {
      return;
    }

    let payload;
    try {
      payload = JSON.parse(dataLines.join('\n'));
    } catch (error) {
      throw new BandyApiError(
        'Bandy a envoyé un événement de flux invalide.',
        null,
        error
      );
    }

    if (event === 'token') {
      if (typeof payload.text !== 'string') {
        throw new BandyApiError('Bandy a envoyé un fragment invalide.', null);
      }
      onToken?.(payload.text);
    } else if (event === 'done') {
      completedResponse = payload;
    } else if (event === 'error') {
      throw new BandyApiError(
        payload.message || 'Bandy n’a pas pu terminer la réponse.',
        null
      );
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let boundary = buffer.search(/\r?\n\r?\n/);
      while (boundary !== -1) {
        const separator = buffer.match(/\r?\n\r?\n/);
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + separator[0].length);
        processFrame(frame);
        boundary = buffer.search(/\r?\n\r?\n/);
      }
      if (done) {
        if (buffer.trim()) {
          processFrame(buffer);
        }
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!completedResponse) {
    throw new BandyApiError(
      'Le flux de Bandy s’est terminé sans réponse finale.',
      null
    );
  }
  return completedResponse;
}
