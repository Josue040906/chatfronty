import React, { useState } from 'react';
import { Send, Sparkles, Mic, Paperclip, Sun, Moon, Smile } from 'lucide-react';

export default function ChatWindow() {
  const [messages, setMessages] = useState([
    { sender: 'user', text: "Salut Nova ! Tu peux m'aider à choisir une palette rose et bleu pour mon appli ?" },
    { sender: 'bot', text: "Avec plaisir ! Voici une base douce et lisible : un rose framboise (#E85D9A) comme accent chaleureux, un bleu lavande (#5C7CFA) pour l'équilibre, et des fonds crème très clairs pour le mode jour." }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: `Analyse en cours concernant : "${input}". Comment souhaitez-vous procéder ?` }
      ]);
    }, 700);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.topBar}>
        <div>
          <h3 style={styles.chatTitle}>Idées de palette rose & bleu</h3>
          <p style={styles.chatSub}>Nova • assistant créatif</p>
        </div>
        <div style={styles.themeToggle}>
          <Sun size={16} color="#fbbf24" />
          <Moon size={16} color="#94a3b8" />
        </div>
      </div>

      {/* Message Feed */}
      <div style={styles.feed}>
        {messages.map((msg, i) => (
          <div key={i} style={{ ...styles.row, justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.sender === 'bot' && (
              <div style={styles.botIcon}>
                <Sparkles size={16} color="#ffffff" />
              </div>
            )}
            
            <div style={{ ...styles.bubble, ...(msg.sender === 'user' ? styles.userBubble : styles.botBubble) }}>
              {msg.text}
            </div>

            {msg.sender === 'user' && (
              <div style={styles.userIcon}>
                <Smile size={18} color="#ffffff" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Chips */}
      <div style={styles.chipsRow}>
        <button style={styles.chip}>Génère une charte complète</button>
        <button style={styles.chip}>Vérifie le contraste d'accessibilité</button>
      </div>

      {/* Input Bar */}
      <div style={styles.inputContainer}>
        <div style={styles.inputWrapper}>
          <Paperclip size={18} color="#94a3b8" style={{ cursor: 'pointer' }} />
          <input
            type="text"
            placeholder="Écris un message à Nova..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={styles.input}
          />
          <Mic size={18} color="#94a3b8" style={{ cursor: 'pointer' }} />
          <button style={styles.sendBtn} onClick={handleSend}>
            <Send size={16} color="#ffffff" />
          </button>
        </div>
        <p style={styles.disclaimer}>Nova peut se tromper. Vérifie les informations importantes.</p>
      </div>
    </div>
  );
}

const styles = {
  container: { flex: 1, height: '100vh', backgroundColor: '#18122B', display: 'flex', flexDirection: 'column', color: '#ffffff' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid #2d234a' },
  chatTitle: { margin: 0, fontSize: '16px', fontWeight: '600' },
  chatSub: { margin: 0, fontSize: '12px', color: '#94a3b8' },
  themeToggle: { display: 'flex', gap: '8px', backgroundColor: '#211935', padding: '6px 12px', borderRadius: '20px', border: '1px solid #2d234a' },
  feed: { flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' },
  row: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  botIcon: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  userIcon: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '60%', padding: '14px 18px', borderRadius: '20px', fontSize: '14px', lineHeight: '1.6' },
  botBubble: { backgroundColor: '#211935', color: '#e2e8f0', border: '1px solid #2d234a', borderTopLeftRadius: '4px' },
  userBubble: { background: 'linear-gradient(135deg, #e85d9a, #d946ef)', color: '#ffffff', borderTopRightRadius: '4px' },
  chipsRow: { display: 'flex', gap: '10px', padding: '0 32px 12px 32px' },
  chip: { backgroundColor: '#211935', border: '1px solid #2d234a', color: '#cbd5e1', padding: '8px 16px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer' },
  inputContainer: { padding: '0 32px 24px 32px', textAlign: 'center' },
  inputWrapper: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#211935', border: '1px solid #2d234a', padding: '8px 16px', borderRadius: '28px' },
  input: { flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '14px' },
  sendBtn: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #e85d9a, #5c7cfa)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  disclaimer: { fontSize: '11px', color: '#64748b', marginTop: '8px' }
};