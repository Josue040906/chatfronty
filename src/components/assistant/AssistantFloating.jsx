import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Clock3,
  Maximize2,
  Minimize2,
  MessageSquareText,
  Plus,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { BANDY_API_URL, getAuthHeaders } from '../../api/client';

const CHAT_STORAGE_KEY = 'sygpers-assistant-chats';
const EMPTY_MESSAGES = [];

function readChats(storageKey) {
  try {
    const savedChats = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(savedChats) ? savedChats : [];
  } catch {
    return [];
  }
}

function formatChatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AssistantFloating({ user }) {
  const chatStorageKey = `${CHAT_STORAGE_KEY}:${user?.userId || 'guest'}`;
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState(() => readChats(chatStorageKey));
  const [activeChatId, setActiveChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages || EMPTY_MESSAGES;
  const userName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.email || 'Utilisateur';

  useEffect(() => {
    localStorage.setItem(chatStorageKey, JSON.stringify(chats));
  }, [chatStorageKey, chats]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, loading]);

  function startNewChat() {
    setActiveChatId(null);
    setMessage('');
    setHistoryOpen(false);
  }

  async function handleSend(event) {
    event?.preventDefault();

    const text = message.trim();

    if (!text || loading) {
      return;
    }

    const chatId = activeChatId || String(Date.now());
    if (!activeChatId) {
      setActiveChatId(chatId);
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
    };

    setChats((previous) => {
      const current = previous.find((chat) => chat.id === chatId);
      const chat = current || {
        id: chatId,
        title: text.slice(0, 48),
        messages: [],
      };
      return [
        {
          ...chat,
          title: chat.messages.length ? chat.title : text.slice(0, 48),
          messages: [...chat.messages, userMessage],
          updatedAt: Date.now(),
        },
        ...previous.filter((item) => item.id !== chatId),
      ];
    });

    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(
        `${BANDY_API_URL}/api/chat`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erreur API ${response.status}`
        );
      }

      const data = await response.json();

      const assistantResponse =
        typeof data === 'string'
          ? data
          : data?.data?.message ||
            data?.data ||
            data?.response ||
            data?.message ||
            data?.content ||
            data?.text ||
            "Je n'ai pas reçu de réponse exploitable.";

      setChats((previous) => previous.map((chat) => (
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, {
                id: Date.now() + 1,
                role: 'assistant',
                content: typeof assistantResponse === 'string'
                  ? assistantResponse
                  : JSON.stringify(assistantResponse),
              }],
              updatedAt: Date.now(),
            }
          : chat
      )));
    } catch (error) {
      console.error(
        'Erreur assistant SYGPERS :',
        error
      );

      setChats((previous) => previous.map((chat) => (
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, {
                id: Date.now() + 1,
                role: 'assistant',
                content: "Je rencontre actuellement un problème de connexion avec le service RH.",
                error: true,
              }],
              updatedAt: Date.now(),
            }
          : chat
      )));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend(event);
    }
  }

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
                <span>
                  Assistant RH · SYGPERS
                </span>
              </div>
            </div>

            <div className="assistant-panel-actions">
              <button
                type="button"
                onClick={startNewChat}
                aria-label="Nouveau chat"
                title="Nouveau chat"
              >
                <Plus size={18} />
              </button>

              <button
                type="button"
                onClick={() => setHistoryOpen((value) => !value)}
                aria-label="Historique des chats"
                title="Historique"
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
                  <span>{chats.length}</span>
                </div>
                {chats.length ? chats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    className="assistant-history-item"
                    onClick={() => {
                      setActiveChatId(chat.id);
                      setHistoryOpen(false);
                    }}
                  >
                    <MessageSquareText size={17} />
                    <span className="assistant-history-copy">
                      <strong>{chat.title || 'Nouvelle conversation'}</strong>
                      <small>{formatChatDate(chat.updatedAt)}</small>
                    </span>
                  </button>
                )) : (
                  <p className="assistant-history-empty">Aucune conversation enregistrée.</p>
                )}
              </div>
            ) : messages.length ? (
              <div className="assistant-messages" ref={messagesRef}>
                {messages.map((item) => (
                  <div
                    key={item.id}
                    className={`assistant-message ${item.role === 'user' ? 'assistant-message-user' : 'assistant-message-bot'}`}
                  >
                    {item.role === 'assistant' && (
                      <div className="assistant-message-avatar"><Bot size={14} /></div>
                    )}
                    <div className={`assistant-message-content ${item.error ? 'assistant-message-error' : ''}`}>
                      {item.content}
                    </div>
                  </div>
                ))}
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
                <p className="assistant-empty-description">Que souhaitez-vous savoir aujourd'hui ?</p>
                <form className="assistant-panel-input assistant-panel-input-centered" onSubmit={handleSend}>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Posez votre question sur les agents, services ou procédures..."
                    rows={2}
                    disabled={loading}
                    aria-label="Message à l'assistant SYGPERS"
                  />
                  <button type="submit" disabled={!message.trim() || loading} aria-label="Envoyer" title="Envoyer">
                    <Send size={17} />
                  </button>
                </form>
              </div>
            )}
          </div>

          {!historyOpen && messages.length > 0 && (
            <form className="assistant-panel-input" onSubmit={handleSend}>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez votre demande..."
                rows={1}
                disabled={loading}
                aria-label="Message à l'assistant SYGPERS"
              />
              <button type="submit" disabled={!message.trim() || loading} aria-label="Envoyer" title="Envoyer">
                <Send size={17} />
              </button>
            </form>
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