import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  confirmPendingAction,
  cancelPendingAction,
} from '../../api/assistant';
import { buildBandyReply, confirmationOutcomeMessage } from './assistant-actions';
import { prefillNavigationState } from '../../utils/bandyPrefill';
import {
  clearStoredConversation,
  getConversationStorageKey,
  readStoredConversation,
  storeConversation,
} from './assistant-conversation-storage';
import { toUiMessages } from './assistant-history';
import AssistantTodo from './AssistantTodo';

const CONVERSATION_PAGE_SIZE = 20;
const EMPTY_MESSAGES = [];
const SUGGESTIONS = [
  'Affiche les agents du SGEAE',
  'Combien d’agents par service ?',
  'Ouvre la fiche de Jean RAKOTO',
];

function getMonotonicTime() {
  return performance.now();
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

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

// Bulle de Bandy complétée par sa réponse finale : son texte et ses actions.
function withBandyResponse(item, response) {
  return { ...item, content: response.message, ...buildBandyReply(response) };
}

const AssistantMessage = memo(function AssistantMessage({ item, onOpenRoute, onSettle }) {
  return (
    <div
      className={`assistant-message ${item.role === 'user' ? 'assistant-message-user' : 'assistant-message-bot'}`}
    >
      {item.role === 'assistant' && (
        <div className="assistant-message-avatar"><Bot size={14} /></div>
      )}
      <div className="assistant-message-body">
        <div className="assistant-message-content">{item.content}</div>
        {item.statistics && (
          <div className="assistant-stats">
            <table>
              {item.statistics.total !== null && (
                <caption>Sur {item.statistics.total} agent{item.statistics.total > 1 ? 's' : ''}</caption>
              )}
              <thead>
                <tr>{item.statistics.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr>
              </thead>
              <tbody>
                {item.statistics.rows.map((row) => (
                  <tr key={row.join('|')}>{row.map((value, index) => <td key={item.statistics.columns[index]}>{value}</td>)}</tr>
                ))}
              </tbody>
            </table>
            {item.statistics.hiddenRows > 0 && (
              <p>… et {item.statistics.hiddenRows} autre{item.statistics.hiddenRows > 1 ? 's' : ''} groupe{item.statistics.hiddenRows > 1 ? 's' : ''}.</p>
            )}
          </div>
        )}
        {item.agents?.length > 0 && (
          <div className="assistant-message-actions">
            {item.agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                className="assistant-message-action assistant-agent-card"
                aria-label={`Ouvrir la fiche de ${agent.name}`}
                onClick={() => onOpenRoute(`/agents/${encodeURIComponent(agent.id)}`)}
              >
                <span className="assistant-agent-card-avatar" aria-hidden="true">
                  {getInitials(agent.name)}
                </span>
                <span className="assistant-agent-card-info">
                  <strong>{agent.name}</strong>
                  {agent.meta && <small>{agent.meta}</small>}
                  {agent.reason && <small className="assistant-agent-card-reason">{agent.reason}</small>}
                  {agent.similarityPercent !== null && (
                    <small>Similarité du nom : {agent.similarityPercent}%</small>
                  )}
                </span>
                <span className="assistant-agent-card-cta" aria-hidden="true">
                  Ouvrir la fiche
                  <ChevronRight size={15} />
                </span>
              </button>
            ))}
          </div>
        )}
        {item.navigation?.length > 0 && (
          <div className="assistant-message-actions">
            {item.navigation.map((action) => (
              <button
                key={action.route}
                type="button"
                className="assistant-message-action"
                onClick={() => onOpenRoute(action.route)}
              >
                <span>{action.label}</span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        )}
        {item.prepared?.length > 0 && (
          <div className="assistant-message-actions">
            {item.prepared.map((action) => (
              <button
                key={action.route}
                type="button"
                className="assistant-message-action assistant-message-action-primary"
                onClick={() => onOpenRoute(action.route, prefillNavigationState(action.fields))}
              >
                <span>
                  {action.label}
                  <small>Champs proposés surlignés en vert, à vérifier avant d’enregistrer</small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        )}
        {item.confirmations?.map((confirmation) => (
          <div key={confirmation.confirmationId} className="assistant-confirmation">
            <p className="assistant-confirmation-title">Action à confirmer</p>
            {confirmation.details.length > 0 && (
              <dl className="assistant-confirmation-details">
                {confirmation.details.map((detail) => (
                  <div key={detail.label}>
                    <dt>{detail.label}</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {confirmation.outcome && (
              <p className="assistant-confirmation-outcome" role="status">
                {confirmation.outcome}
              </p>
            )}
            {(confirmation.status === 'pending' || confirmation.status === 'running') && (
              <div className="assistant-confirmation-buttons">
                <button
                  type="button"
                  className="assistant-confirmation-confirm"
                  disabled={confirmation.status === 'running'}
                  onClick={() => onSettle(item.id, confirmation.confirmationId, 'confirm')}
                >
                  {confirmation.status === 'running' ? 'Exécution…' : 'Confirmer'}
                </button>
                <button
                  type="button"
                  className="assistant-confirmation-cancel"
                  disabled={confirmation.status === 'running'}
                  onClick={() => onSettle(item.id, confirmation.confirmationId, 'cancel')}
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default function AssistantFloating({ user }) {
  const navigate = useNavigate();
  const userId = user?.userId;
  const conversationStorageKey = getConversationStorageKey(userId);
  const [openState, setOpen] = useState(false);
  const [expandedState, setExpanded] = useState(false);
  // La page /assistant est la même conversation, ouverte en plein écran.
  const onAssistantPage = useLocation().pathname === '/assistant';
  const open = openState || onAssistantPage;
  const expanded = expandedState || onAssistantPage;
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
  // Clic « Confirmer » ou « Annuler » sur une tâche confirmée. Bandy exécute
  // au plus une fois ; l'API décide des droits et la carte affiche l'issue.
  const settleConfirmation = useCallback(async (messageId, confirmationId, decision) => {
    const conversationId = activeChatId;
    const update = (changes) => setChats((previous) => previous.map((chat) => (
      chat.id !== conversationId
        ? chat
        : {
            ...chat,
            messages: chat.messages.map((item) => (
              item.id !== messageId
                ? item
                : {
                    ...item,
                    confirmations: item.confirmations.map((confirmation) => (
                      confirmation.confirmationId === confirmationId
                        ? { ...confirmation, ...changes }
                        : confirmation
                    )),
                  }
            )),
          }
    )));

    update({ status: 'running', outcome: '' });
    try {
      if (decision === 'confirm') {
        const outcome = await confirmPendingAction(conversationId, confirmationId);
        update({ status: 'done', outcome: confirmationOutcomeMessage(outcome) });
      } else {
        await cancelPendingAction(conversationId, confirmationId);
        update({ status: 'cancelled', outcome: 'Action annulée : rien n’a été exécuté.' });
      }
    } catch (error) {
      // Panne ou réseau : la demande reste confirmable (même clé d'idempotence).
      // Refus définitif (déjà traitée, expirée, introuvable) : la carte se ferme.
      const retryable = error?.status == null || error.status >= 500;
      update({
        status: retryable ? 'pending' : 'done',
        outcome: error?.message || 'Bandy n’a pas pu traiter la confirmation.',
      });
    }
  }, [activeChatId]);

  // Seule façon de quitter l'assistant vers une page : la route a été validée
  // (route interne) ; le garde de routes du front décide ensuite de l'accès.
  const openRoute = useCallback((route, state) => {
    setOpen(false);
    setExpanded(false);
    setHistoryOpen(false);
    navigate(route, state ? { state } : undefined);
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

  // En arrivant sur /assistant, l'historique du volet latéral se charge,
  // comme lorsqu'on agrandit la bulle.
  useEffect(() => {
    if (onAssistantPage) {
      void loadHistory(0);
    }
  }, [onAssistantPage]);

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
                  ? withBandyResponse(item, response)
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

  const historyPanel = (
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
  );

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

              {!onAssistantPage && (
              <button
                type="button"
                onClick={() => {
                  const nextExpanded = !expanded;
                  setExpanded(nextExpanded);
                  if (nextExpanded) {
                    void loadHistory(0);
                  }
                }}
                aria-label={expanded ? 'Quitter le plein écran' : 'Agrandir en plein écran'}
                title={expanded ? 'Réduire' : 'Plein écran'}
              >
                {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setExpanded(false);
                  setHistoryOpen(false);
                  if (onAssistantPage) {
                    navigate('/dashboard');
                  }
                }}
                aria-label="Fermer l'assistant"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className={`assistant-panel-body${expanded ? ' assistant-panel-body-split' : ''}`}>
            {expanded && (
              <aside className="assistant-history-side" aria-label="Historique des conversations">
                <button type="button" className="assistant-history-new" onClick={startNewChat}>
                  <Plus size={16} />
                  Nouvelle conversation
                </button>
                {historyPanel}
              </aside>
            )}
            <div className="assistant-panel-main">
            {historyOpen && !expanded ? (
              historyPanel
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
                    onOpenRoute={openRoute}
                    onSettle={settleConfirmation}
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
                    <AssistantTodo onOpen={openRoute} disabled={loading || Boolean(failedSend)} />
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
          </div>

          {sendError && !(historyOpen && !expanded) && (
            <div className="assistant-send-error" role="alert">
              <span>{sendError}</span>
              {failedSend && (
                <button type="button" onClick={() => void retryFailedSend()} disabled={loading}>
                  Réessayer
                </button>
              )}
            </div>
          )}

          {!(historyOpen && !expanded) && messages.length > 0 && (
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
