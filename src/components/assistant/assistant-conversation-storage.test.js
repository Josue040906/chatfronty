import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearStoredConversation,
  getConversationStorageKey,
  readStoredConversation,
  storeConversation,
} from './assistant-conversation-storage';

describe('assistant conversation storage', () => {
  const values = new Map();

  afterEach(() => {
    values.clear();
    vi.unstubAllGlobals();
  });

  it('scopes the active conversation key to the signed-in user', () => {
    expect(getConversationStorageKey('user-42'))
      .toBe('bandy-active-conversation:user-42');
    expect(getConversationStorageKey(null)).toBeNull();
  });

  it('stores and restores only the active conversation metadata', () => {
    vi.stubGlobal('localStorage', {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    });
    const key = getConversationStorageKey('user-42');
    const conversation = {
      id: 'ebae5ca9-dc99-433f-b3c8-9c4efd9e9c66',
      label: 'Mon historique',
      status: 'ACTIVE',
      createdAt: '2026-10-24T10:00:00Z',
      lastActivityAt: '2026-10-24T10:01:00Z',
      messages: [{ content: 'not persisted' }],
    };

    storeConversation(key, conversation);

    expect(readStoredConversation(key)).toEqual({
      id: conversation.id,
      label: conversation.label,
      status: conversation.status,
      createdAt: conversation.createdAt,
      lastActivityAt: conversation.lastActivityAt,
    });
    expect(values.get(key)).not.toContain('not persisted');
  });

  it('clears invalid stored conversation identifiers', () => {
    vi.stubGlobal('localStorage', {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    });
    const key = getConversationStorageKey('user-42');
    values.set(key, JSON.stringify({ id: 'not-a-uuid' }));

    expect(readStoredConversation(key)).toBeNull();
    expect(values.has(key)).toBe(false);
  });

  it('clears the active conversation when requested', () => {
    vi.stubGlobal('localStorage', {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    });
    const key = getConversationStorageKey('user-42');
    values.set(key, '{"id":"ebae5ca9-dc99-433f-b3c8-9c4efd9e9c66"}');

    clearStoredConversation(key);

    expect(values.has(key)).toBe(false);
  });
});
