const CONVERSATION_ID_PATTERN = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

export function getConversationStorageKey(userId) {
  return userId ? `bandy-active-conversation:${userId}` : null;
}

export function readStoredConversation(storageKey) {
  if (!storageKey) {
    return null;
  }

  try {
    const storedValue = localStorage.getItem(storageKey);
    if (!storedValue) {
      return null;
    }

    const conversation = JSON.parse(storedValue);
    if (!CONVERSATION_ID_PATTERN.test(conversation?.id || '')) {
      localStorage.removeItem(storageKey);
      return null;
    }

    return {
      id: conversation.id,
      label: conversation.label,
      status: conversation.status,
      createdAt: conversation.createdAt,
      lastActivityAt: conversation.lastActivityAt,
    };
  } catch (error) {
    console.error('Impossible de restaurer la conversation Bandy enregistrée.', error);
    return null;
  }
}

export function storeConversation(storageKey, conversation) {
  if (!storageKey || !conversation?.id) {
    return;
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify({
      id: conversation.id,
      label: conversation.label,
      status: conversation.status,
      createdAt: conversation.createdAt,
      lastActivityAt: conversation.lastActivityAt,
    }));
  } catch (error) {
    console.error('Impossible d’enregistrer la conversation Bandy active.', error);
  }
}

export function clearStoredConversation(storageKey) {
  if (!storageKey) {
    return;
  }

  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Impossible d’effacer la conversation Bandy active.', error);
  }
}
