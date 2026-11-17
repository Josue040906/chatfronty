import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Check,
  FilePen,
  FileSignature,
  GraduationCap,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
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
import { getAFaire } from '../../api/aFaire';
import { getTodoItems } from './assistant-actions';
import { isoToday } from '../../utils/documentCycle';
import AssistantComposer from './AssistantComposer';
import { messageWithAttachment } from './assistant-attachment';
import { deposerPieceScannee } from '../../api/piecesScannees';
import TypeEmploiBadge from '../agents/TypeEmploiBadge';
import { classeTypeEmploi } from '../../utils/typeEmploi';
import useMediaQuery from '../../hooks/useMediaQuery';

const CONVERSATION_PAGE_SIZE = 20;
const EMPTY_MESSAGES = [];
const TITRE_PAR_DEFAUT = 'Nouvelle conversation';
const SUGGESTIONS = [
  { texte: 'Combien d’agents contractuels par service ?', Icone: Users },
  { texte: 'Quelles demandes attendent leur réponse signée ?', Icone: FileSignature },
  { texte: 'Montre-moi les stagiaires', Icone: GraduationCap },
];
const UN_JOUR = 24 * 60 * 60 * 1000;

function getMonotonicTime() {
  return performance.now();
}

function chatDate(chat) {
  const date = new Date(chat.lastActivityAt || chat.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Aujourd'hui : l'heure ; avant : le jour et le mois.
function formatChatDate(date) {
  if (!date) {
    return '';
  }
  const memeJour = date.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat('fr-FR', memeJour
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short' }).format(date);
}

/** Les conversations rangées par Aujourd’hui, Cette semaine, Plus ancien (groupes vides omis). */
function groupChats(chats) {
  const debutDuJour = new Date();
  debutDuJour.setHours(0, 0, 0, 0);
  const groupes = [
    { titre: 'Aujourd’hui', chats: [] },
    { titre: 'Cette semaine', chats: [] },
    { titre: 'Plus ancien', chats: [] },
  ];
  for (const chat of chats) {
    const date = chatDate(chat);
    const index = date && date >= debutDuJour ? 0
      : date && date >= new Date(debutDuJour.getTime() - 6 * UN_JOUR) ? 1 : 2;
    groupes[index].chats.push(chat);
  }
  return groupes.filter((groupe) => groupe.chats.length > 0);
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/**
 * Après une tâche confirmée qui a créé un document à partir d'une pièce
 * jointe, l'original est déposé sur ce document. Renvoie la phrase à ajouter
 * au résultat affiché (vide s'il n'y avait pas de pièce).
 */
async function attachScan(outcome, scan) {
  const documentId = outcome?.result?.id;
  if (!scan || outcome?.status !== 'CONFIRMED' || !Number.isSafeInteger(documentId)) {
    return '';
  }
  try {
    await deposerPieceScannee('DOCUMENT', documentId, scan);
    return ' La pièce scannée est jointe au brouillon.';
  } catch (error) {
    return ` La pièce scannée n’a pas pu être jointe : ${error.message || 'erreur inconnue'}.`;
  }
}

// Bulle de Bandy complétée par sa réponse finale : son texte et ses actions.
function withBandyResponse(item, response) {
  return { ...item, content: response.message, ...buildBandyReply(response) };
}

// La marque de Band’IAkam : un « B » sur la couleur de l’application.
function BandyMark({ small = false }) {
  return <span className={`assistant-mark${small ? ' assistant-mark-small' : ''}`} aria-hidden="true">B</span>;
}

const AssistantMessage = memo(function AssistantMessage({ item, onOpenRoute, onSettle }) {
  if (item.role === 'user') {
    return (
      <div className="assistant-message assistant-message-user">
        <div className="assistant-message-content">{item.content}</div>
      </div>
    );
  }

  return (
    <div className="assistant-message assistant-message-bot">
      <BandyMark small />
      <div className="assistant-message-body">
        {item.content ? (
          <div className="assistant-message-content">{item.content}</div>
        ) : !item.statistics && !item.agents?.length && !item.navigation?.length
          && !item.prepared?.length && !item.confirmations?.length && (
          <span className="assistant-typing" role="status" aria-label="Band’IAkam écrit"><i /><i /><i /></span>
        )}
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
          <div className="assistant-agent-list">
            {item.agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                className="assistant-agent-row"
                aria-label={`Ouvrir la fiche de ${agent.name}`}
                onClick={() => onOpenRoute(`/agents/${encodeURIComponent(agent.id)}`)}
              >
                <span className={`assistant-agent-avatar ${classeTypeEmploi(agent.typeEmploi)}`.trim()} aria-hidden="true">
                  {getInitials(agent.name)}
                </span>
                <span className="assistant-agent-info">
                  <strong>{agent.name}</strong>
                  {agent.meta && <small>{agent.meta}</small>}
                  {agent.reason && agent.reason !== agent.typeEmploi && (
                    <small className="assistant-agent-reason">{agent.reason}</small>
                  )}
                  {agent.similarityPercent !== null && (
                    <small>Nom ressemblant à {agent.similarityPercent} %</small>
                  )}
                </span>
                <TypeEmploiBadge type={agent.typeEmploi} />
                <ChevronRight size={16} className="assistant-agent-chevron" aria-hidden="true" />
              </button>
            ))}
            {item.agents.length > 1 && (
              <p className="assistant-agent-foot">{item.agents.length} agents</p>
            )}
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
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        {item.prepared?.map((action) => (
          <div key={action.route} className="assistant-card">
            <div className="assistant-card-top">
              <span className="assistant-card-icon" aria-hidden="true"><FilePen size={17} /></span>
              <span className="assistant-card-title">
                <strong>{action.label}</strong>
                <small>Les champs proposés sont surlignés en vert : vérifie-les avant d’enregistrer.</small>
              </span>
            </div>
            <div className="assistant-card-buttons">
              <button
                type="button"
                className="assistant-button assistant-button-primary"
                onClick={() => onOpenRoute(action.route, prefillNavigationState(action.fields, item.scan))}
              >
                Ouvrir le formulaire
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
        {item.confirmations?.map((confirmation) => (
          <div key={confirmation.confirmationId} className="assistant-card">
            <div className="assistant-card-top">
              <span className="assistant-card-icon" aria-hidden="true"><ClipboardCheck size={17} /></span>
              <span className="assistant-card-title">
                <strong>{confirmation.title || 'Action à confirmer'}</strong>
                {confirmation.verified && (
                  <small className="assistant-card-verified">
                    <ShieldCheck size={13} aria-hidden="true" />
                    Vérifiée par l’API · rien n’est encore enregistré
                  </small>
                )}
              </span>
            </div>
            {confirmation.details.length > 0 && (
              <dl className="assistant-card-details">
                {confirmation.details.map((detail) => (
                  <div key={detail.label}>
                    <dt>{detail.label}</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {confirmation.outcome && (
              <p className="assistant-card-outcome" role="status">
                {confirmation.outcome}
              </p>
            )}
            {(confirmation.status === 'pending' || confirmation.status === 'running') && (
              <div className="assistant-card-buttons">
                <button
                  type="button"
                  className="assistant-button assistant-button-primary"
                  disabled={confirmation.status === 'running'}
                  onClick={() => onSettle(item.id, confirmation.confirmationId, 'confirm', item.scan)}
                >
                  {confirmation.status === 'running' ? 'Exécution…' : (confirmation.confirmLabel || 'Confirmer')}
                </button>
                <button
                  type="button"
                  className="assistant-button assistant-button-ghost"
                  disabled={confirmation.status === 'running'}
                  onClick={() => onSettle(item.id, confirmation.confirmationId, 'cancel')}
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        ))}
        {item.trace?.length > 0 && (
          <p className="assistant-trace" aria-label="Ce que Band’IAkam a consulté">
            <Search size={13} aria-hidden="true" />
            {item.trace.map((etape) => <span key={etape}>{etape}</span>)}
          </p>
        )}
      </div>
    </div>
  );
});

export default function AssistantFloating({ user }) {
  const navigate = useNavigate();
  const userId = user?.userId;
  const conversationStorageKey = getConversationStorageKey(userId);
  const [openState, setOpen] = useState(false);
  // Le point du jour, montré à la première ouverture de la journée, même en pleine conversation.
  const [pointDuJour, setPointDuJour] = useState(false);
  const [expandedState, setExpanded] = useState(false);
  // La page /assistant est la même conversation, ouverte en plein écran.
  const onAssistantPage = useLocation().pathname === '/assistant';
  const open = openState || onAssistantPage;

  // Une fois par jour et par utilisateur, la bulle s'ouvre sur le point du jour s'il y a quelque chose à dire.
  useEffect(() => {
    if (!userId) return undefined;
    const cle = `bandiakam-point-du-jour:${userId}`;
    const jour = isoToday();
    let dejaVu;
    try { dejaVu = window.localStorage.getItem(cle); } catch { dejaVu = null; }
    if (dejaVu === jour) return undefined;
    const controller = new AbortController();
    getAFaire(controller.signal)
      .then((elements) => {
        if (getTodoItems(elements).length > 0) {
          setOpen(true);
          setPointDuJour(true);
        }
        try { window.localStorage.setItem(cle, jour); } catch { /* préférence locale facultative */ }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [userId]);
  const expanded = expandedState || onAssistantPage;
  const [historyOpen, setHistoryOpen] = useState(false);
  const [message, setMessage] = useState('');
  // Photo ou PDF joint au prochain message (voir assistant-attachment.js).
  const [attachment, setAttachment] = useState(null);
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
  const followBottomRef = useRef(true);
  const sendingRef = useRef(false);
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages || EMPTY_MESSAGES;
  // L'accueil salue par le prénom seul (le nom complet s'il manque).
  const userName = user?.prenom?.trim().split(/\s+/)[0] || user?.nom || '';
  const [historySearch, setHistorySearch] = useState('');
  // Même seuil que assistant.css : en dessous, le plein écran n'a pas de volet latéral.
  const petitEcran = useMediaQuery('(max-width: 768px)');
  // Clic « Confirmer » ou « Annuler » sur une tâche confirmée. Bandy exécute
  // au plus une fois ; l'API décide des droits et la carte affiche l'issue.
  const settleConfirmation = useCallback(async (messageId, confirmationId, decision, scan = null) => {
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
        update({
          status: 'done',
          outcome: `${confirmationOutcomeMessage(outcome)}${await attachScan(outcome, scan)}`,
        });
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
        outcome: error?.message || 'Band’IAkam n’a pas pu traiter la confirmation.',
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
          throw new Error('La réponse de Band’IAkam ne contient pas les messages de la conversation.');
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
          console.error('Impossible de restaurer la conversation Band’IAkam :', error);
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

  // Le fil suit la réponse (texte, puis fiches et cartes) tant qu'on est en bas ;
  // il ne bouge pas si on est remonté lire un message plus ancien.
  useEffect(() => {
    if (messagesRef.current && (shouldScrollToBottomRef.current || followBottomRef.current)) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      shouldScrollToBottomRef.current = false;
      followBottomRef.current = true;
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

  // silencieux : relecture discrète (le titre d'une conversation qui vient de
  // recevoir sa première question), sans indicateur de chargement.
  async function loadHistory(page = 0, { silencieux = false } = {}) {
    if (silencieux) {
      setHistoryError('');
    } else if (page === 0) {
      setHistoryLoading(true);
      setHistoryError('');
    } else {
      setHistoryLoadingMore(true);
    }

    try {
      const data = await listConversations(page, CONVERSATION_PAGE_SIZE);
      if (!Array.isArray(data?.items)) {
        throw new Error('La réponse de Band’IAkam ne contient pas la liste des conversations.');
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
      if (error.status !== 401 && !silencieux) {
        console.error('Impossible de charger l’historique Band’IAkam :', error);
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
      console.error('Impossible de renommer cette conversation Band’IAkam :', error);
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
      console.error('Impossible de supprimer cette conversation Band’IAkam :', error);
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
        throw new Error('La réponse de Band’IAkam ne contient pas les messages de la conversation.');
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
        console.error('Impossible de charger cette conversation Band’IAkam :', error);
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
        throw new Error('La réponse de Band’IAkam ne contient pas les messages de la conversation.');
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
    // Une suggestion part seule ; sinon la pièce jointe accompagne le texte.
    const sentAttachment = suggestedMessage === undefined ? attachment : null;
    if ((!text && !sentAttachment) || sendingRef.current || failedSend
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
          throw new Error('Band’IAkam n’a pas renvoyé l’identifiant de la conversation créée.');
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
        content: messageWithAttachment(text, sentAttachment),
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
      setAttachment(null);

      await completeSend(conversationId, text, idempotencyKey, sentAttachment);
      if (!activeChatId) {
        // Band’IAkam vient de titrer la conversation d'après cette question.
        void loadHistory(0, { silencieux: true });
      }
    } catch (error) {
      sendOutcome = error.status ? 'http_error' : 'client_or_network_error';
      sendStatus = error.status || null;
      if (error.status !== 401) {
        console.error('Erreur Band’IAkam :', error);
        setSendError(error.message || 'Impossible d’envoyer le message à Band’IAkam.');
        setFailedSend({
          conversationId,
          idempotencyKey,
          text,
          attachment: sentAttachment,
          optimisticMessageAdded,
        });
        if (!optimisticMessageAdded) {
          setMessage(text);
          setAttachment(sentAttachment);
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

  async function completeSend(conversationId, text, idempotencyKey, sentAttachment = null) {
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
                // La pièce jointe du tour (un File), gardée en mémoire seulement :
                // elle sera attachée à ce que l'utilisateur validera.
                scan: sentAttachment?.file || null,
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
          attachment: sentAttachment,
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
        throw new Error('Band’IAkam n’a pas renvoyé de réponse exploitable.');
      }
      if (String(response.conversationId) !== conversationId) {
        throw new Error('La réponse de Band’IAkam ne correspond pas à la conversation active.');
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
          throw new Error('Band’IAkam n’a pas renvoyé l’identifiant de la conversation créée.');
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
                    content: messageWithAttachment(failedSend.text, failedSend.attachment),
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
        failedSend.idempotencyKey,
        failedSend.attachment
      );
    } catch (error) {
      if (error.status !== 401) {
        console.error('Nouvelle tentative assistant échouée :', error);
        setSendError(error.message || 'Impossible de renvoyer le message à Band’IAkam.');
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

  const recherche = historySearch.trim().toLocaleLowerCase('fr');
  const shownChats = recherche
    ? chats.filter((chat) => (chat.label || TITRE_PAR_DEFAUT).toLocaleLowerCase('fr').includes(recherche))
    : chats;
  const chatTitle = activeChat?.label || TITRE_PAR_DEFAUT;
  const disabledInput = loading || Boolean(failedSend);
  // L'historique prend la place du fil là où le volet latéral manque : bulle, ou plein écran sur mobile.
  const showHistoryInBody = historyOpen && (!expanded || petitEcran);

  const historyPanel = (
      <div className="assistant-history">
        <label className="assistant-history-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={historySearch}
            onChange={(event) => setHistorySearch(event.target.value)}
            placeholder="Rechercher"
            aria-label="Rechercher une conversation"
          />
        </label>
        {historyLoading ? (
          <p className="assistant-history-status" role="status">Chargement de l’historique…</p>
        ) : historyError && chats.length === 0 ? (
          <div className="assistant-inline-error" role="alert">
            <span>{historyError}</span>
            <button type="button" onClick={() => void loadHistory(0)}>Réessayer</button>
          </div>
        ) : chats.length === 0 ? (
          <p className="assistant-history-status">Aucune conversation enregistrée.</p>
        ) : (
          <>
            {historyError && (
              <div className="assistant-inline-error" role="alert">
                <span>{historyError}</span>
                <button type="button" onClick={() => setHistoryError('')}>Fermer</button>
              </div>
            )}
            {shownChats.length === 0 && (
              <p className="assistant-history-status">Aucune conversation ne correspond.</p>
            )}
            {groupChats(shownChats).map((groupe) => (
              <section key={groupe.titre} className="assistant-history-group" aria-label={groupe.titre}>
                <h2>{groupe.titre}</h2>
                {groupe.chats.map((chat) => (
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
                          aria-current={chat.id === activeChatId ? 'true' : undefined}
                          onClick={() => void selectConversation(chat.id)}
                        >
                          <strong>{chat.label || TITRE_PAR_DEFAUT}</strong>
                          <small>
                            {chat.status === 'ARCHIVED' ? 'Archivée · ' : ''}
                            {formatChatDate(chatDate(chat))}
                          </small>
                        </button>
                        <div className="assistant-history-actions">
                          <button
                            type="button"
                            aria-label={`Renommer ${chat.label || 'la conversation'}`}
                            title="Renommer"
                            disabled={historyActionId === chat.id}
                            onClick={() => beginRenameConversation(chat)}
                          >
                            <Pencil size={14} />
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
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </section>
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
          {expanded && (
            <aside className="assistant-side" aria-label="Vos conversations">
              <button type="button" className="assistant-side-new" onClick={startNewChat}>
                <Plus size={16} aria-hidden="true" />
                Nouvelle conversation
              </button>
              {historyPanel}
            </aside>
          )}

          <section className="assistant-main" aria-label="Band’IAkam">
            <header className="assistant-panel-header">
              <BandyMark />
              <div className="assistant-panel-identity">
                <strong>{expanded ? chatTitle : 'Band’IAkam'}</strong>
                <span>
                  <i className={`assistant-status-dot${loading ? ' is-busy' : ''}`} aria-hidden="true" />
                  {expanded ? 'Band’IAkam' : 'Assistant RH'} · {loading ? 'écrit…' : 'prêt'}
                </span>
              </div>

              <div className="assistant-panel-actions">
                {!expanded && (
                  <button
                    type="button"
                    onClick={startNewChat}
                    aria-label="Nouvelle conversation"
                    title="Nouvelle conversation"
                  >
                    <Plus size={18} />
                  </button>
                )}

                <button
                  type="button"
                  className="assistant-history-toggle"
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
                      setHistoryOpen(false);
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
            </header>

            <div className="assistant-panel-body">
              {showHistoryInBody ? (
                historyPanel
              ) : conversationLoading ? (
                <div className="assistant-panel-status" role="status">
                  <span className="assistant-typing" aria-hidden="true"><i /><i /><i /></span>
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
                <div
                  className="assistant-messages"
                  ref={messagesRef}
                  onScroll={(event) => {
                    const zone = event.currentTarget;
                    followBottomRef.current = zone.scrollHeight - zone.scrollTop - zone.clientHeight < 80;
                  }}
                >
                  {pointDuJour && (
                    <div className="assistant-point-du-jour">
                      <button type="button" className="assistant-icon-button" aria-label="Fermer le point du jour"
                        onClick={() => setPointDuJour(false)}>
                        <X size={14} />
                      </button>
                      <AssistantTodo onOpen={openRoute} disabled={disabledInput} />
                    </div>
                  )}
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
                  {loading && messages.at(-1)?.role !== 'assistant' && (
                    <div className="assistant-message assistant-message-bot">
                      <BandyMark small />
                      <span className="assistant-typing" role="status" aria-label="Band’IAkam écrit"><i /><i /><i /></span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="assistant-welcome">
                  <div className="assistant-welcome-heading">
                    <h1>{userName ? `Bonjour ${userName}` : 'Bonjour'}</h1>
                    <p>
                      {archivedConversation
                        ? 'Cette conversation est archivée. Démarre-en une nouvelle pour continuer.'
                        : 'Pose une question sur les agents, les demandes ou les carrières.'}
                    </p>
                  </div>
                  {!archivedConversation && (
                    <>
                      <AssistantTodo onOpen={openRoute} disabled={disabledInput} />
                      <div className="assistant-suggestions" aria-label="Suggestions">
                        <p className="assistant-section-title">Essayer</p>
                        {SUGGESTIONS.map(({ texte, Icone }) => (
                          <button
                            key={texte}
                            type="button"
                            disabled={disabledInput}
                            onClick={() => void handleSend(undefined, texte)}
                          >
                            <Icone size={16} aria-hidden="true" />
                            {texte}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {sendError && !showHistoryInBody && (
              <div className="assistant-send-error" role="alert">
                <span>{sendError}</span>
                {failedSend && (
                  <button type="button" onClick={() => void retryFailedSend()} disabled={loading}>
                    Réessayer
                  </button>
                )}
              </div>
            )}

            {!showHistoryInBody && !conversationLoading && !conversationError && (
              archivedConversation ? (
                <p className="assistant-archive-notice">Cette conversation est archivée et ne peut plus recevoir de messages.</p>
              ) : (
                <AssistantComposer
                  className="assistant-panel-input"
                  value={message}
                  onChange={setMessage}
                  onKeyDown={handleKeyDown}
                  onSubmit={handleSend}
                  placeholder={messages.length ? 'Écris ta demande…' : 'Pose ta question, ou joins une photo ou un PDF…'}
                  disabled={disabledInput}
                  attachment={attachment}
                  onAttachmentChange={setAttachment}
                  hint={messages.length === 0}
                />
              )
            )}
          </section>
        </div>
      )}

      {!expanded && (
        <button
          type="button"
          className={`assistant-floating-button ${open ? 'assistant-floating-button-open' : ''}`}
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Fermer Band’IAkam' : 'Ouvrir Band’IAkam'}
          title="Band’IAkam"
        >
          {open ? <X size={22} /> : <Sparkles size={20} />}
          {!open && <span className="assistant-floating-label">Band’IAkam</span>}
        </button>
      )}
    </>
  );
}
