import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, X, Maximize2, Minimize2, ChevronRight } from 'lucide-react';
import { COLORS, accentGradient, accentGradientSoft } from '../../theme';


const SIZES = ['small', 'wide', 'full'];
const SIZE_WIDTH = { small: '380px', wide: '560px', full: '100vw' };
const SUGGESTIONS = [
  'Affiche les agents du SGEAE',
  'Combien dâ€™agents par service ?',
  'Ouvre la fiche de Jean RAKOTO',
];

// ============================================================
// RENDU DU TEXTE GEMINI
// ============================================================
function GeminiText({ text, darkMode }) {
  if (!text) return null;
  const lines = text.split(/\r?\n/);

  return (
    <div>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={index} style={{ height: '7px' }} />;
        }

        const listMatch = trimmed.match(/^[-*]\s+(.*)$/);
        if (listMatch) {
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '7px',
                marginBottom: '4px'
              }}
            >
              <span
                style={{
                  marginTop: '7px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: darkMode ? '#cbd5e1' : '#64748b',
                  flexShrink: 0
                }}
              />
              <span>
                <FormattedText text={listMatch[1]} />
              </span>
            </div>
          );
        }

        return (
          <div key={index} style={{ minHeight: '1.55em' }}>
            <FormattedText text={line} />
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// FORMATAGE SIMPLE DU MARKDOWN
// ============================================================
function FormattedText({ text }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

// ============================================================
// PANNEAU ASSISTANT
// ============================================================
export default function AssistantPanel({
  open,
  onOpen,
  onClose,
  darkMode
}) {
  const [size, setSize] = useState('small');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Bonjour, je suis bandI'Akam. Posez-moi une question sur les agents, les services ou vos tÃ¢ches â€” je peux aussi ouvrir directement un Ã©cran pour vous."
    },
  ]);

  const feedRef = useRef(null);
  const styles = getStyles(darkMode, size);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, open]);

  const cycleSize = () =>
    setSize((s) => SIZES[(SIZES.indexOf(s) + 1) % SIZES.length]);

  // ==========================================================
  // ENVOI AU BACKEND
  // ==========================================================
  const send = async (text) => {
    if (sending) return;
    const query = (text ?? input).trim();
    if (!query) return;

    setSending(true);

    setMessages((m) => [
      ...m,
      { role: 'user', text: query }
    ]);
    setInput('');

    setMessages((m) => [
      ...m,
      { role: 'assistant', text: 'Analyse de votre demande...' }
    ]);

    try {
      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: query })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const reply = await response.text();

      setMessages((m) => [
        ...m.slice(0, -1),
        { role: 'assistant', text: reply }
      ]);
    } catch (error) {
      console.error('Erreur lors de la communication avec le backend :', error);

      setMessages((m) => [
        ...m.slice(0, -1),
        {
          role: 'assistant',
          text: "Je n'arrive pas Ã  communiquer avec le serveur RH."
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        style={styles.launcher}
        onClick={onOpen}
        title="Ouvrir bandI'Akam"
      >
        <Sparkles size={17} />
        <span>
          band<span style={styles.iaHighlightOnGradient}>I'A</span>kam
        </span>
      </button>
    );
  }

  return (
    <aside style={styles.panel}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>
            <Sparkles size={15} color="#fff" />
          </span>
          <div>
            <p style={styles.name}>
              band<span style={styles.iaHighlight}>I'A</span>kam
            </p>
            <p style={styles.status}>ConnectÃ© aux donnÃ©es RH</p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.iconBtn}
            onClick={cycleSize}
            title="Changer la taille"
          >
            {size === 'full' ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <button
            style={styles.iconBtn}
            onClick={onClose}
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* CONVERSATION */}
      <div style={styles.feed} ref={feedRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={msg.role === 'user' ? styles.userRow : styles.botRow}
          >
            <div style={msg.role === 'user' ? styles.userBubble : styles.botBubble}>
              {msg.role === 'assistant' ? (
                <GeminiText text={msg.text} darkMode={darkMode} />
              ) : (
                msg.text
              )}
            </div>

            {msg.action && (
              <button style={styles.actionBtn} onClick={msg.action.run}>
                {msg.action.label}
                <ChevronRight size={14} />
              </button>
            )}

            {msg.list && (
              <div style={styles.resultList}>
                {msg.list.map((item) => (
                  <button
                    key={item.id}
                    style={styles.resultItem}
                    onClick={item.onClick}
                  >
                    <span style={styles.resultLabel}>{item.label}</span>
                    {item.meta && (
                      <span style={styles.resultMeta}>{item.meta}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SUGGESTIONS */}
      <div style={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            style={styles.chip}
            onClick={() => send(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* COMPOSER */}
      <div style={styles.composer}>
        <input
          style={styles.input}
          placeholder="Ã‰crivez votre demande..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              send();
            }
          }}
        />

        <button
          style={styles.sendBtn}
          onClick={() => send()}
          disabled={sending}
        >
          <Send size={15} color="#fff" />
        </button>
      </div>

      <p style={styles.disclaimer}>
        Aide Ã  l'analyse â€” ne constitue pas une dÃ©cision RH automatique.
      </p>
    </aside>
  );
}

// ============================================================
// STYLES
// ============================================================
const getStyles = (darkMode, size) => ({
  launcher: {
    position: 'fixed',
    left: '20px',
    bottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 18px',
    borderRadius: '999px',
    border: 'none',
    background: accentGradientSoft,
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: "'Baloo 2', sans-serif",
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(230, 57, 70, 0.4)',
    zIndex: 80
  },
  iaHighlightOnGradient: {
    fontWeight: '800',
    color: '#ffffff',
    textDecoration: 'underline',
    textDecorationColor: 'rgba(255,255,255,0.6)',
    textUnderlineOffset: '2px'
  },
  panel: {
    position: 'fixed',
    left: 0,
    bottom: 0,
    top: size === 'full' ? 0 : 'auto',
    height: size === 'full' ? '100vh' : '78vh',
    width: SIZE_WIDTH[size],
    maxWidth: '100vw',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: darkMode ? COLORS.darkSurface : '#ffffff',
    borderRight: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0',
    borderTop: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0',
    borderTopRightRadius: size === 'full' ? 0 : '18px',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
    zIndex: 90
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0',
    flexShrink: 0
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logo: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: accentGradientSoft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  name: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: "'Baloo 2', sans-serif",
    color: darkMode ? '#ffffff' : '#0f172a'
  },
  iaHighlight: {
    fontWeight: '800',
    background: accentGradientSoft,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent'
  },
  status: {
    margin: 0,
    fontSize: '11px',
    color: COLORS.green
  },
  headerActions: {
    display: 'flex',
    gap: '4px'
  },
  iconBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '9px',
    border: 'none',
    background: 'transparent',
    color: darkMode ? '#94a3b8' : '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  feed: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  botRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    maxWidth: '92%'
  },
  userRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
    maxWidth: '92%',
    alignSelf: 'flex-end'
  },
  botBubble: {
    padding: '11px 14px',
    borderRadius: '14px',
    borderTopLeftRadius: '4px',
    backgroundColor: darkMode ? '#2B1B14' : '#f1f5f9',
    color: darkMode ? '#e2e8f0' : '#1e293b',
    fontSize: '13.5px',
    lineHeight: 1.55
  },
  userBubble: {
    padding: '11px 14px',
    borderRadius: '14px',
    borderTopRightRadius: '4px',
    background: accentGradient,
    color: '#fff',
    fontSize: '13.5px',
    lineHeight: 1.55
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    borderRadius: '10px',
    border: `1px solid ${COLORS.violet}`,
    background: 'transparent',
    color: COLORS.violet,
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  resultList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    width: '100%'
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '10px',
    border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0',
    backgroundColor: darkMode ? '#2B1B14' : '#f8fafc',
    cursor: 'pointer',
    textAlign: 'left'
  },
  resultLabel: {
    fontSize: '12.5px',
    fontWeight: '600',
    color: darkMode ? '#ffffff' : '#0f172a'
  },
  resultMeta: {
    fontSize: '11px',
    color: '#94a3b8'
  },
  suggestions: {
    display: 'flex',
    gap: '6px',
    padding: '0 16px 10px',
    flexWrap: 'wrap',
    flexShrink: 0
  },
  chip: {
    padding: '6px 11px',
    borderRadius: '999px',
    border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0',
    backgroundColor: 'transparent',
    color: darkMode ? '#cbd5e1' : '#475569',
    fontSize: '11.5px',
    cursor: 'pointer'
  },
  composer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '0 16px',
    padding: '6px 6px 6px 14px',
    borderRadius: '999px',
    border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #cbd5e1',
    backgroundColor: darkMode ? COLORS.darkBg : '#f8fafc',
    flexShrink: 0
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: darkMode ? '#ffffff' : '#0f172a',
    fontSize: '13.5px'
  },
  sendBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    background: accentGradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0
  },
  disclaimer: {
    fontSize: '10.5px',
    color: '#94a3b8',
    textAlign: 'center',
    margin: '8px 16px 12px',
    flexShrink: 0
  }
});

