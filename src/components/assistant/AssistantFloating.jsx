import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  ChevronRight,
  Clock3,
  Check,
  Maximize2,
  Minimize2,
  MessageSquareText,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  createConversation,
  deleteConversation,
  listConversationMessages,
  listConversations,
  MESSAGE_PAGE_SIZE,
  renameConversation,
  sendConversationMessage,
} from '../../api/assistant';
import { getNavigableAgents } from './assistant-agents';
import { toUiMessages } from './assistant-history';

const CONVERSATION_PAGE_SIZE = 20;
const EMPTY_MESSAGES = [];
const CONVERSATION_ID_PATTERN = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
const SUGGESTIONS = [
  'Affiche les agents du SGEAE',
  'Combien d’agents par service ?',
  'Ouvre la fiche de Jean RAKOTO',
];

function getMonotonicTime() {
  return performance.now();
}

function getConversationStorageKey(userId) {
  return userId ? `bandy-active-conversation:${userId}` : null;
}

function readStoredConversation(storageKey) {
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

function storeConversation(storageKey, conversation) {
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

function clearStoredConversation(storageKey) {
  if (!storageKey) {
    return;
  }

  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Impossible d’effacer la conversation Bandy active.', error);
  }
}

function formatChatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const AssistantMessage = memo(function AssistantMessage({ item, onOpenAgent }) {
  return (
    <div
      className={`assistant-message ${item.role === 'user' ? 'assistant-message-user' : 'assistant-message-bot'}`}
    >
      {item.role === 'assistant' && (
        <div className="assistant-message-avatar"><Bot size={14} /></div>
      )}
      <div className="assistant-message-content">{item.content}</div>
      {item.agents?.length > 0 && (
        <div className="assistant-message-actions">
          {item.agents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              className="assistant-message-action"
              onClick={() => onOpenAgent(agent.id)}
            >
              <span>
                Ouvrir la fiche de {agent.name}
                {agent.meta && <small>{agent.meta}</small>}
                {agent.similarityPercent !== null && (
                  <small>Similarité du nom : {agent.similarityPercent}%</small>
                )}
              </span>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default function AssistantFloating({ user }) {
  const navigate = useNavigate();
  const userId = user?.userId;
  const conversationStorageKey = getConversationStorageKey(userId);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingInitialMessage, setPendingInitialMessage] = useState('');
  const [chats, setChats] = useState(() => {
    const conversation = readStoredConversation(conversationStorageKey);
    return conversation
      ? [{ ...conversation, messages: EMPTY_MESSAGES, messagesPage: 0, totalMessages: 0 }]
      : [];
  });
  const [activeChatId, setActiveChatId] = useState(
    () => readStoredConversation(conversationStorageKey)?.id || null
  );
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [historyActionId, setHistoryActionId] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(
    () => Boolean(readStoredConversation(conversationStorageKey))
  );
  const [conversationError, setConversationError] = useState('');
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [sendError, setSendError] = useState('');
  const [failedSend, setFailedSend] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);
  const conversationRequestRef = useRef(0);
  const conversationAbortRef = useRef(null);
  const shouldScrollToBottomRef = useRef(true);
  const sendingRef = useRef(false);
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages || EMPTY_MESSAGES;
  const userName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.email || 'Utilisateur';
  const openAgentProfile = useCallback((agentId) => {
    setOpen(false);
    setExpanded(false);
    setHistoryOpen(false);
    navigate(`/agents/${encodeURIComponent(agentId)}`);
  }, [navigate]);

  useEffect(() => {
    const requestId = ++conversationRequestRef.current;
    const controller = new AbortController();
    conversationAbortRef.current?.abort();
    conversationAbortRef.current = controller;
    const storedConversation = readStoredConversation(conversationStorageKey);

    async function restoreConversation() {
      if (!storedConversation) {
        return;
      }

      try {
        const firstPage = await listConversationMessages(
          storedConversation.id,
          0,
          { signal: controller.signal }
        );
        if (!Array.isArray(firstPage?.items)) {
          throw new Error('La réponse de Bandy ne contient pas les messages de la conversation.');
        }

        const lastPageNumber = Math.max(
          0,
          Math.ceil(firstPage.total / MESSAGE_PAGE_SIZE) - 1
        );
        const lastPage = lastPageNumber === 0
          ? firstPage
          : await listConversationMessages(
              storedConversation.id,
              lastPageNumber,
              { signal: controller.signal }
            );

        if (requestId !== conversationRequestRef.current) {
          return;
        }

        setChats([{
          ...storedConversation,
          messages: toUiMessages(lastPage.items),
          messagesPage: lastPageNumber,
          totalMessages: firstPage.total,
        }]);
      } catch (error) {
        if (
          error.status !== 401 &&
          !controller.signal.aborted &&
          requestId === conversationRequestRef.current
        ) {
          console.error('Impossible de restaurer la conversation Bandy :', error);
          setConversationError(error.message || 'Impossible de restaurer la conversation.');
        }
      } finally {
        if (requestId === conversationRequestRef.current) {
          setConversationLoading(false);
        }
      }
    }

    void restoreConversation();

    return () => {
      controller.abort();
      if (conversationAbortRef.current === controller) {
        conversationAbortRef.current = null;
      }
      if (conversationRequestRef.current === requestId) {
        conversationRequestRef.current += 1;
      }
    };
  }, [conversationStorageKey]);

  useEffect(() => {
    if (messagesRef.current && shouldScrollToBottomRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      shouldScrollToBottomRef.current = false;
    }
  }, [messages, loading, conversationLoading]);

  function startNewChat() {
    conversationRequestRef.current += 1;
    conversationAbortRef.current?.abort();
    clearStoredConversation(conversationStorageKey);
    setActiveChatId(null);
    setMessage('');
    setPendingInitialMessage('');
    setSendError('');
    setFailedSend(null);
    setConversationError('');
    setConversationLoading(false);
    setHistoryOpen(false);
  }

  async function loadHistory(page = 0) {
    if (page === 0) {
      setHistoryLoading(true);
      setHistoryError('');
    } else {
      setHistoryLoadingMore(true);
    }

    try {
      const data = await listConversations(page, CONVERSATION_PAGE_SIZE);
      if (!Array.isArray(data?.items)) {
        throw new Error('La réponse de Bandy ne contient pas la liste des conversations.');
      }

      const pageChats = data.items.map((conversation) => ({
        ...conversation,
        id: String(conversation.id),
      }));
      const pageIds = new Set(pageChats.map((chat) => chat.id));

      setChats((previous) => {
        const mergedChats = pageChats.map((chat) => {
          const existing = previous.find((item) => item.id === chat.id);
          return existing ? { ...existing, ...chat, messages: existing.messages } : chat;
        });
        const otherChats = previous.filter((chat) => !pageIds.has(chat.id));
        return page === 0
          ? [...mergedChats, ...otherChats]
          : [...previous, ...mergedChats.filter(
              (chat) => !previous.some((item) => item.id === chat.id)
            )];
      });
      setHistoryPage(page);
      setHistoryTotal(data.total);
    } catch (error) {
      if (error.status !== 401) {
        console.error('Impossible de charger l’historique Bandy :', error);
        setHistoryError(error.message || 'Impossible de charger les conversations.');
      }
    } finally {
      setHistoryLoading(false);
      setHistoryLoadingMore(false);
    }
  }

  function beginRenameConversation(chat) {
    setEditingConversationId(chat.id);
    setEditingLabel(chat.label || '');
    setHistoryError('');
  }

  async function saveConversationName(event, chat) {
    event.preventDefault();
    const label = editingLabel.trim();
    if (!label) {
      setHistoryError('Le nom de la conversation ne peut pas être vide.');
      return;
    }

    setHistoryActionId(chat.id);
    setHistoryError('');
    try {
      await renameConversation(chat.id, label);
      setChats((previous) => previous.map((item) => (
        item.id === chat.id ? { ...item, label } : item
      )));
      if (chat.id === activeChatId) {
        storeConversation(conversationStorageKey, { ...chat, label });
      }
      setEditingConversationId(null);
      setEditingLabel('');
    } catch (error) {
      console.error('Impossible de renommer cette conversation Bandy :', error);
      setHistoryError(error.message || 'Impossible de renommer cette conversation.');
    } finally {
      setHistoryActionId(null);
    }
  }

  async function removeConversation(chat) {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${chat.label || 'Nouvelle conversation'} » et tous ses messages ? Cette action est irréversible.`
    );
    if (!confirmed) {
      return;
    }

    setHistoryActionId(chat.id);
    setHistoryError('');
    try {
      await deleteConversation(chat.id);
      setChats((previous) => previous.filter((item) => item.id !== chat.id));
      setHistoryTotal((total) => Math.max(0, total - 1));
      if (chat.id === activeChatId) {
        conversationRequestRef.current += 1;
        conversationAbortRef.current?.abort();
        clearStoredConversation(conversationStorageKey);
        setActiveChatId(null);
        setPendingInitialMessage('');
        setConversationError('');
        setConversationLoading(false);
        setFailedSend(null);
        setSendError('');
      }
      if (editingConversationId === chat.id) {
        setEditingConversationId(null);
        setEditingLabel('');
      }
    } catch (error) {
      console.error('Impossible de supprimer cette conversation Bandy :', error);
      setHistoryError(error.message || 'Impossible de supprimer cette conversation.');
    } finally {
      setHistoryActionId(null);
    }
  }

  async function selectConversation(chatId) {
    const requestId = ++conversationRequestRef.current;
    conversationAbortRef.current?.abort();
    const controller = new AbortController();
    conversationAbortRef.current = controller;
    const selectedConversation = chats.find((chat) => chat.id === chatId);
    storeConversation(conversationStorageKey, selectedConversation);
    setActiveChatId(chatId);
    setPendingInitialMessage('');
    setHistoryOpen(false);
    setSendError('');
    setFailedSend(null);
    setConversationError('');
    setConversationLoading(true);
    setLoadingEarlier(false);
    shouldScrollToBottomRef.current = true;

    try {
      const firstPage = await listConversationMessages(chatId, 0, {
        signal: controller.signal,
      });
      if (!Array.isArray(firstPage?.items)) {
        throw new Error('La réponse de Bandy ne contient pas les messages de la conversation.');
      }

      const lastPageNumber = Math.max(
        0,
        Math.ceil(firstPage.total / MESSAGE_PAGE_SIZE) - 1
      );
      const lastPage = lastPageNumber === 0
        ? firstPage
        : await listConversationMessages(chatId, lastPageNumber, {
            signal: controller.signal,
          });

      if (requestId !== conversationRequestRef.current) {
        return;
      }

      shouldScrollToBottomRef.current = true;
      setChats((previous) => previous.map((chat) => (
        chat.id === chatId
          ? {
              ...chat,
              messages: toUiMessages(lastPage.items),
              messagesPage: lastPageNumber,
              totalMessages: firstPage.total,
            }
          : chat
      )));
    } catch (error) {
      if (
        error.status !== 401 &&
        !controller.signal.aborted &&
        requestId === conversationRequestRef.current
      ) {
        console.error('Impossible de charger cette conversation Bandy :', error);
        setConversationError(error.message || 'Impossible de charger cette conversation.');
      }
    } finally {
      if (requestId === conversationRequestRef.current) {
        setConversationLoading(false);
        if (conversationAbortRef.current === controller) {
          conversationAbortRef.current = null;
        }
      }
    }
  }

  async function loadEarlierMessages() {
    if (!activeChat || loadingEarlier || activeChat.messagesPage < 1) {
      return;
    }

    setLoadingEarlier(true);
    shouldScrollToBottomRef.current = false;
    try {
      const pageNumber = activeChat.messagesPage - 1;
      const data = await listConversationMessages(activeChat.id, pageNumber);
      if (!Array.isArray(data?.items)) {
        throw new Error('La réponse de Bandy ne contient pas les messages de la conversation.');
      }

      setChats((previous) => previous.map((chat) => (
        chat.id === activeChat.id
          ? {
              ...chat,
              messages: [...toUiMessages(data.items), ...chat.messages],
              messagesPage: pageNumber,
              totalMessages: data.total,
            }
          : chat
      )));
    } catch (error) {
      if (error.status !== 401) {
        console.error('Impossible de charger les messages précédents :', error);
        setConversationError(error.message || 'Impossible de charger les messages précédents.');
      }
    } finally {
      setLoadingEarlier(false);
    }
  }

  async function handleSend(event, suggestedMessage) {
    event?.preventDefault();

    const text = (suggestedMessage ?? message).trim();
    if (!text || sendingRef.current || failedSend
      || activeChat?.status === 'ARCHIVED') {
      return;
    }

    sendingRef.current = true;
    const idempotencyKey = crypto.randomUUID();
    const sendStartedAt = getMonotonicTime();
    let conversationId = activeChatId;
    let optimisticMessageAdded = false;
    let sendOutcome = 'success';
    let sendStatus = null;
    setPendingInitialMessage(text);
    setLoading(true);
    setSendError('');
    shouldScrollToBottomRef.current = true;

    try {
      if (!conversationId) {
        const conversation = await createConversation();
        if (!conversation?.id) {
          throw new Error('Bandy n’a pas renvoyé l’identifiant de la conversation créée.');
        }

        conversationId = String(conversation.id);
        storeConversation(conversationStorageKey, {
          ...conversation,
          id: conversationId,
        });
        setActiveChatId(conversationId);
        setChats((previous) => [
          {
            ...conversation,
            id: conversationId,
            messages: EMPTY_MESSAGES,
            messagesPage: 0,
            totalMessages: 0,
          },
          ...previous.filter((chat) => chat.id !== conversationId),
        ]);
      }

      const userMessage = {
        id: idempotencyKey,
        role: 'user',
        content: text,
      };

      shouldScrollToBottomRef.current = true;
      setChats((previous) => previous.map((chat) => (
        chat.id === conversationId
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              totalMessages: (chat.totalMessages || 0) + 1,
            }
          : chat
      )));
      optimisticMessageAdded = true;
      setPendingInitialMessage('');
      setMessage('');

      await completeSend(conversationId, text, idempotencyKey);
    } catch (error) {
      sendOutcome = error.status ? 'http_error' : 'client_or_network_error';
      sendStatus = error.status || null;
      if (error.status !== 401) {
        console.error('Erreur assistant SYGPERS :', error);
        setSendError(error.message || 'Impossible d’envoyer le message à Bandy.');
        setFailedSend({
          conversationId,
          idempotencyKey,
          text,
          optimisticMessageAdded,
        });
        if (!optimisticMessageAdded) {
          setMessage(text);
        }
      }
    } finally {
      if (import.meta.env.DEV) {
        console.info('bandy_frontend event=assistant_send_flow', {
          request_id: idempotencyKey,
          duration_ms: Math.round(getMonotonicTime() - sendStartedAt),
          status: sendStatus,
          outcome: sendOutcome,
        });
      }
      sendingRef.current = false;
      setPendingInitialMessage('');
      setLoading(false);
    }
  }

  async function completeSend(conversationId, text, idempotencyKey) {
    const assistantMessageId = crypto.randomUUID();
    shouldScrollToBottomRef.current = true;
    setChats((previous) => previous.map((chat) => (
      chat.id === conversationId
        ? {
            ...chat,
            messages: [
              ...chat.messages,
              {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
              },
            ],
          }
        : chat
    )));

    try {
      const response = await sendConversationMessage(
        conversationId,
        text,
        idempotencyKey,
        {
          onToken: (token) => {
            setChats((previous) => previous.map((chat) => (
              chat.id === conversationId
                ? {
                    ...chat,
                    messages: chat.messages.map((item) => (
                      item.id === assistantMessageId
                        ? { ...item, content: item.content + token }
                        : item
                    )),
                  }
                : chat
            )));
          },
        }
      );
      if (typeof response?.message !== 'string') {
        throw new Error('Bandy n’a pas renvoyé de réponse exploitable.');
      }
      if (String(response.conversationId) !== conversationId) {
        throw new Error('La réponse de Bandy ne correspond pas à la conversation active.');
      }

      setChats((previous) => previous.map((chat) => (
        chat.id === conversationId
          ? {
              ...chat,
              messages: chat.messages.map((item) => (
                item.id === assistantMessageId
                  ? {
                      ...item,
                      content: response.message,
                      agents: getNavigableAgents(response.toolResults),
                    }
                  : item
              )),
              totalMessages: (chat.totalMessages || 0) + 1,
              lastActivityAt: new Date().toISOString(),
            }
          : chat
      )));
      setFailedSend(null);
      setSendError('');
    } catch (error) {
      setChats((previous) => previous.map((chat) => (
        chat.id === conversationId
          ? {
              ...chat,
              messages: chat.messages.filter(
                (item) => item.id !== assistantMessageId
              ),
            }
          : chat
      )));
      throw error;
    }
  }

  async function retryFailedSend() {
    if (!failedSend || sendingRef.current) {
      return;
    }

    sendingRef.current = true;
    setLoading(true);
    setSendError('');

    let conversationId = failedSend.conversationId;
    try {
      if (!conversationId) {
        const conversation = await createConversation();
        if (!conversation?.id) {
          throw new Error('Bandy n’a pas renvoyé l’identifiant de la conversation créée.');
        }

        conversationId = String(conversation.id);
        storeConversation(conversationStorageKey, {
          ...conversation,
          id: conversationId,
        });
        setActiveChatId(conversationId);
        setChats((previous) => [
          {
            ...conversation,
            id: conversationId,
            messages: EMPTY_MESSAGES,
            messagesPage: 0,
            totalMessages: 0,
          },
          ...previous.filter((chat) => chat.id !== conversationId),
        ]);
      }

      if (!failedSend.optimisticMessageAdded) {
        setChats((previous) => previous.map((chat) => (
          chat.id === conversationId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    id: failedSend.idempotencyKey,
                    role: 'user',
                    content: failedSend.text,
                  },
                ],
                totalMessages: (chat.totalMessages || 0) + 1,
              }
            : chat
        )));
        setMessage('');
      }

      await completeSend(
        conversationId,
        failedSend.text,
        failedSend.idempotencyKey
      );
    } catch (error) {
      if (error.status !== 401) {
        console.error('Nouvelle tentative assistant échouée :', error);
        setSendError(error.message || 'Impossible de renvoyer le message à Bandy.');
        setFailedSend({ ...failedSend, conversationId });
      }
    } finally {
      sendingRef.current = false;
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend(event);
    }
  }

  const hasEarlierMessages = activeChat
    && activeChat.messagesPage > 0
    && activeChat.messages.length < activeChat.totalMessages;
  const hasMoreConversations = Math.min(
    (historyPage + 1) * CONVERSATION_PAGE_SIZE,
    historyTotal
  ) < historyTotal;
  const archivedConversation = activeChat?.status === 'ARCHIVED';

  return (
    <>
      {open && (
        <div className={`assistant-floating-panel${expanded ? ' assistant-floating-panel-fullscreen' : ''}`}>
          <div className="assistant-panel-header">
            <div className="assistant-panel-identity">
              <div className="assistant-panel-avatar">
                <Bot size={19} />
              </div>

              <div>
                <strong>Assistant SYGPERS</strong>
                <span>Historique synchronisé avec Bandy</span>
              </div>
            </div>

            <div className="assistant-panel-actions">
              <button
                type="button"
                onClick={startNewChat}
                aria-label="Nouvelle conversation"
                title="Nouvelle conversation"
              >
                <Plus size={18} />
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextOpen = !historyOpen;
                  setHistoryOpen(nextOpen);
                  if (nextOpen) {
                    void loadHistory(0);
                  }
                }}
                aria-label="Historique des conversations"
                title="Historique des conversations"
                aria-pressed={historyOpen}
              >
                <Clock3 size={17} />
              </button>

              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-label={expanded ? 'Quitter le plein écran' : 'Agrandir en plein écran'}
                title={expanded ? 'Réduire' : 'Plein écran'}
              >
                {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setExpanded(false);
                  setHistoryOpen(false);
                }}
                aria-label="Fermer l'assistant"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="assistant-panel-body">
            {historyOpen ? (
              <div className="assistant-history">
                <div className="assistant-history-heading">
                  <span>Vos conversations</span>
                  <span>{historyTotal}</span>
                </div>
                {historyLoading ? (
                  <p className="assistant-history-status" role="status">Chargement de l’historique…</p>
                ) : historyError && chats.length === 0 ? (
                  <div className="assistant-inline-error" role="alert">
                    <span>{historyError}</span>
                    <button type="button" onClick={() => void loadHistory(0)}>Réessayer</button>
                  </div>
                ) : chats.length === 0 ? (
                  <p className="assistant-history-empty">Aucune conversation enregistrée.</p>
                ) : (
                  <>
                    {historyError && (
                      <div className="assistant-inline-error" role="alert">
                        <span>{historyError}</span>
                        <button type="button" onClick={() => setHistoryError('')}>Fermer</button>
                      </div>
                    )}
                    {chats.map((chat) => (
                      <div className="assistant-history-row" key={chat.id}>
                        {editingConversationId === chat.id ? (
                          <form
                            className="assistant-history-rename"
                            onSubmit={(event) => void saveConversationName(event, chat)}
                          >
                            <input
                              aria-label="Nom de la conversation"
                              autoFocus
                              maxLength={200}
                              value={editingLabel}
                              onChange={(event) => setEditingLabel(event.target.value)}
                            />
                            <button
                              type="submit"
                              aria-label="Enregistrer le nom"
                              title="Enregistrer"
                              disabled={historyActionId === chat.id}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label="Annuler le renommage"
                              title="Annuler"
                              disabled={historyActionId === chat.id}
                              onClick={() => {
                                setEditingConversationId(null);
                                setEditingLabel('');
                              }}
                            >
                              <X size={16} />
                            </button>
                          </form>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={`assistant-history-item${chat.id === activeChatId ? ' assistant-history-item-active' : ''}`}
                              onClick={() => void selectConversation(chat.id)}
                            >
                              <MessageSquareText size={17} />
                              <span className="assistant-history-copy">
                                <strong>{chat.label || 'Nouvelle conversation'}</strong>
                                <small>
                                  {chat.status === 'ARCHIVED' ? 'Archivée · ' : ''}
                                  {formatChatDate(chat.lastActivityAt || chat.createdAt)}
                                </small>
                              </span>
                            </button>
                            <div className="assistant-history-actions">
                              <button
                                type="button"
                                aria-label={`Renommer ${chat.label || 'la conversation'}`}
                                title="Renommer"
                                disabled={historyActionId === chat.id}
                                onClick={() => beginRenameConversation(chat)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                aria-label={`Supprimer ${chat.label || 'la conversation'}`}
                                title="Supprimer définitivement"
                                disabled={
                                  historyActionId === chat.id
                                  || (chat.id === activeChatId && loading)
                                }
                                onClick={() => void removeConversation(chat)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {hasMoreConversations && (
                      <button
                        type="button"
                        className="assistant-history-more"
                        disabled={historyLoadingMore}
                        onClick={() => void loadHistory(historyPage + 1)}
                      >
                        {historyLoadingMore ? 'Chargement…' : 'Charger les conversations précédentes'}
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : conversationLoading ? (
              <div className="assistant-panel-status" role="status">
                <div className="assistant-message-content assistant-typing"><span /><span /><span /></div>
                <span>Chargement de la conversation…</span>
              </div>
            ) : conversationError ? (
              <div className="assistant-panel-status">
                <div className="assistant-inline-error" role="alert">
                  <span>{conversationError}</span>
                  <button type="button" onClick={() => void selectConversation(activeChatId)}>
                    Réessayer
                  </button>
                </div>
              </div>
            ) : messages.length || pendingInitialMessage ? (
              <div className="assistant-messages" ref={messagesRef}>
                {hasEarlierMessages && (
                  <button
                    type="button"
                    className="assistant-history-more"
                    disabled={loadingEarlier}
                    onClick={() => void loadEarlierMessages()}
                  >
                    {loadingEarlier ? 'Chargement…' : 'Charger les messages précédents'}
                  </button>
                )}
                {messages.map((item) => (
                  <AssistantMessage
                    key={item.id}
                    item={item}
                    onOpenAgent={openAgentProfile}
                  />
                ))}
                {pendingInitialMessage && (
                  <div className="assistant-message assistant-message-user">
                    <div className="assistant-message-content">{pendingInitialMessage}</div>
                  </div>
                )}
                {loading && (
                  <div className="assistant-message assistant-message-bot">
                    <div className="assistant-message-avatar"><Bot size={14} /></div>
                    <div className="assistant-message-content assistant-typing"><span /><span /><span /></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="assistant-empty-state">
                <div className="assistant-empty-mark"><Sparkles size={20} /></div>
                <p className="assistant-empty-eyebrow">VOTRE ASSISTANT RH</p>
                <h1>Bonjour, <span>{userName}</span></h1>
                <p className="assistant-empty-description">
                  {archivedConversation
                    ? 'Cette conversation est archivée. Démarrez-en une nouvelle pour continuer.'
                    : 'Que souhaitez-vous savoir aujourd’hui ?'}
                </p>
                {!archivedConversation && (
                  <>
                    <div className="assistant-suggestions" aria-label="Suggestions">
                      {SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          disabled={loading || Boolean(failedSend)}
                          onClick={() => void handleSend(undefined, suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                    <form className="assistant-panel-input assistant-panel-input-centered" onSubmit={handleSend}>
                      <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Posez votre question sur les agents, services ou procédures..."
                        rows={2}
                        disabled={loading || Boolean(failedSend)}
                        aria-label="Message à l'assistant SYGPERS"
                      />
                      <button type="submit" disabled={!message.trim() || loading || Boolean(failedSend)} aria-label="Envoyer" title="Envoyer">
                        <Send size={17} />
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>

          {sendError && !historyOpen && (
            <div className="assistant-send-error" role="alert">
              <span>{sendError}</span>
              {failedSend && (
                <button type="button" onClick={() => void retryFailedSend()} disabled={loading}>
                  Réessayer
                </button>
              )}
            </div>
          )}

          {!historyOpen && messages.length > 0 && (
            archivedConversation ? (
              <p className="assistant-archive-notice">Cette conversation est archivée et ne peut plus recevoir de messages.</p>
            ) : (
              <form className="assistant-panel-input" onSubmit={handleSend}>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrivez votre demande..."
                  rows={1}
                  disabled={loading || Boolean(failedSend)}
                  aria-label="Message à l'assistant SYGPERS"
                />
                <button type="submit" disabled={!message.trim() || loading || Boolean(failedSend)} aria-label="Envoyer" title="Envoyer">
                  <Send size={17} />
                </button>
              </form>
            )
          )}
        </div>
      )}

      {!expanded && (
        <button
          type="button"
          className={`assistant-floating-button ${open ? 'assistant-floating-button-open' : ''}`}
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Fermer l’assistant SYGPERS' : 'Ouvrir l’assistant SYGPERS'}
          title="Assistant SYGPERS"
        >
          {open ? <X size={22} /> : <Sparkles size={22} />}
          {!open && <span className="assistant-floating-label">Assistant RH</span>}
        </button>
      )}
    </>
  );
}
