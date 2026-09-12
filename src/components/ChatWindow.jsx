import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

export default function ChatWindow() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Bonjour ! Je suis l\'Assistant RH. Comment puis-je vous aider aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulation de réponse de l'IA (mock)
    setTimeout(() => {
      const botResponse = { 
        sender: 'bot', 
        text: `Données analysées pour votre requête : "${input}". (Connecteur backend en attente)` 
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 800);
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.messageList}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ ...styles.messageRow, justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.sender === 'bot' && <div style={styles.botAvatar}><Bot size={18} color="#fff" /></div>}
            <div style={{ ...styles.bubble, ...(msg.sender === 'user' ? styles.userBubble : styles.botBubble) }}>
              {msg.text}
            </div>
            {msg.sender === 'user' && <div style={styles.userAvatar}><User size={18} color="#fff" /></div>}
          </div>
        ))}
      </div>

      <div style={styles.inputArea}>
        <input
          type="text"
          placeholder="Posez une question sur les postes, candidats, compétences..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={styles.input}
        />
        <button onClick={handleSend} style={styles.sendBtn}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  chatContainer: { flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc' },
  messageList: { flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' },
  messageRow: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  botAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  userAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '60%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', lineHeight: '1.5' },
  botBubble: { backgroundColor: '#fff', color: '#1e293b', border: '1px solid #e2e8f0' },
  userBubble: { backgroundColor: '#6366f1', color: '#fff' },
  inputArea: { padding: '16px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px' },
  input: { flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' },
  sendBtn: { padding: '12px 16px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }
};