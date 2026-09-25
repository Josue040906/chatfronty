import { useState } from 'react';
import {
  Bot,
  ChevronDown,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

export default function AssistantFloating() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content:
        "Bonjour 👋 Je suis bandI'Akama, l'assistant RH de SYGPERS. Comment puis-je vous aider ?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function handleSend(event) {
    event?.preventDefault();

    const text = message.trim();

    if (!text || loading) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/chat`,
        {
          method: 'POST',
          headers: {
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
          : data?.response ||
            data?.message ||
            data?.content ||
            data?.text ||
            "Je n'ai pas reçu de réponse exploitable.";

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: assistantResponse,
        },
      ]);
    } catch (error) {
      console.error(
        'Erreur bandI\'Akama :',
        error
      );

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content:
            "Je rencontre actuellement un problème de connexion avec le service RH.",
          error: true,
        },
      ]);
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
        <div className="assistant-floating-panel">
          <div className="assistant-panel-header">
            <div className="assistant-panel-identity">
              <div className="assistant-panel-avatar">
                <Bot size={19} />
              </div>

              <div>
                <strong>bandI'Akama</strong>
                <span>
                  Assistant RH · SYGPERS
                </span>
              </div>
            </div>

            <div className="assistant-panel-actions">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Réduire l'assistant"
                title="Réduire"
              >
                <ChevronDown size={18} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer l'assistant"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="assistant-panel-body">
            <div className="assistant-welcome">
              <div className="assistant-welcome-icon">
                <Sparkles size={17} />
              </div>

              <div>
                <strong>
                  Besoin d'aide ?
                </strong>

                <p>
                  Posez votre question sur les
                  agents, services, documents ou
                  procédures RH.
                </p>
              </div>
            </div>

            <div className="assistant-messages">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`assistant-message ${
                    item.role === 'user'
                      ? 'assistant-message-user'
                      : 'assistant-message-bot'
                  }`}
                >
                  {item.role === 'assistant' && (
                    <div className="assistant-message-avatar">
                      <Bot size={14} />
                    </div>
                  )}

                  <div
                    className={`assistant-message-content ${
                      item.error
                        ? 'assistant-message-error'
                        : ''
                    }`}
                  >
                    {item.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="assistant-message assistant-message-bot">
                  <div className="assistant-message-avatar">
                    <Bot size={14} />
                  </div>

                  <div className="assistant-message-content assistant-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>
          </div>

          <form
            className="assistant-panel-input"
            onSubmit={handleSend}
          >
            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre demande..."
              rows={1}
              disabled={loading}
              aria-label="Message à bandI'Akama"
            />

            <button
              type="submit"
              disabled={!message.trim() || loading}
              aria-label="Envoyer"
              title="Envoyer"
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`assistant-floating-button ${
          open
            ? 'assistant-floating-button-open'
            : ''
        }`}
        onClick={() => setOpen((value) => !value)}
        aria-label={
          open
            ? "Fermer bandI'Akama"
            : "Ouvrir bandI'Akama"
        }
        title="bandI'Akama"
      >
        {open ? (
          <X size={22} />
        ) : (
          <Sparkles size={22} />
        )}

        {!open && (
          <span className="assistant-floating-label">
            bandI'Akama
          </span>
        )}
      </button>
    </>
  );
}