import { BANDY_API_URL, getAuthHeaders } from './client';

const CONVERSATIONS_URL = `${BANDY_API_URL}/api/conversations`;
const MESSAGE_PAGE_SIZE = 100;

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const response = await fetch(`${CONVERSATIONS_URL}${path}`, {
    method,
    headers: {
      ...getAuthHeaders(),
      ...(body === undefined
        ? {}
        : { 'Content-Type': 'application/json; charset=utf-8' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(
      data?.message || `Erreur Bandy ${response.status}: ${response.statusText}`
    );
  }

  return data;
}

export function listConversations(page = 0, size = 50, { signal } = {}) {
  return request(`?page=${page}&size=${size}`, { signal });
}

export function createConversation() {
  return request('', { method: 'POST' });
}

export function listConversationMessages(conversationId, page = 0, { signal } = {}) {
  return request(
    `/${encodeURIComponent(conversationId)}/messages?page=${page}&size=${MESSAGE_PAGE_SIZE}`,
    { signal }
  );
}

export function sendConversationMessage(conversationId, message, idempotencyKey) {
  return request(`/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: { message },
    headers: idempotencyKey
      ? { 'Idempotency-Key': idempotencyKey }
      : {},
  });
}

export { MESSAGE_PAGE_SIZE };
