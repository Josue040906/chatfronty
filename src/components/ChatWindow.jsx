import React, { useState } from 'react';
import { Send, Sparkles, Mic, Paperclip, Sun, Moon, Smile } from 'lucide-react';
import { COLORS, accentGradient } from '../theme';
import EmployeeRankingCard from './EmployeeRankingCard';

// Démonstration de réponse structurée : le backend (Spring Boot + LLM) pourra
// renvoyer { type: 'employee_ranking' | 'employee_profile' | 'competency_analysis' | 'text', message, data }.
// React choisit alors le rendu adapté au lieu d'un simple texte. Les valeurs
// ci-dessous reprennent l'exemple validé de la documentation du projet
// (poste "Controleur financier", scores calculés par couverture de compétences).
const CONTROLEUR_FINANCIER_RANKING = {
  poste: 'Contrôleur financier',
  requiredCount: 4,
  dataDate: '13/09/2026',
  candidates: [
    {
      rank: 1,
      name: 'Sarah RAZAFI',
      role: 'Analyste financier',
      match: 93.75,
      defaultExpanded: true,
      competencies: [
        { label: 'Analyse financière', niveau: 5, requis: 3, ok: true },
        { label: 'Gestion budgétaire', niveau: 4, requis: 3, ok: true },
        { label: 'Comptabilité publique', niveau: 4, requis: 3, ok: true },
        { label: 'Contrôle financier', niveau: 3, requis: 4, ok: false },
      ],
    },
    { rank: 2, name: 'Luc ANDRIANA', role: 'Administrateur systèmes', match: 50.0 },
    { rank: 3, name: 'Jean RAKOTO', role: 'Développeur logiciel', match: 41.67 },
    { rank: 4, name: 'Marie RASOLO', role: 'Développeur logiciel', match: 25.0 },
  ],
};

const SUGGESTIONS = [
  { label: 'Trouver les meilleurs candidats', prompt: 'Qui est le meilleur candidat pour le poste de contrôleur financier ?' },
  { label: "Lister les employés d'un service", prompt: 'Liste les employés de la Direction Informatique.' },
  { label: "Analyser les compétences d'un employé", prompt: 'Quelles sont les compétences de Sarah RAZAFI ?' },
  { label: "Voir les compétences requises d'un poste", prompt: 'Quelles compétences sont requises pour le poste de Gestionnaire budgétaire ?' },
  { label: 'Comparer deux employés', prompt: 'Compare les compétences de Jean RAKOTO et Marie RASOLO.' },
];

// Génère une réponse simulée le temps que le backend soit branché : c'est
// uniquement pour illustrer, côté frontend, le fonctionnement du système de
// réponses typées décrit ci-dessus.
function mockAssistantReply(query) {
  const q = query.toLowerCase();
  if (q.includes('candidat') || q.includes('correspond') || q.includes('contrôleur') || q.includes('controleur')) {
    return {
      sender: 'bot',
      type: 'employee_ranking',
      text: "J'ai analysé les compétences requises du poste et les compétences actuellement enregistrées pour les employés.",
      data: CONTROLEUR_FINANCIER_RANKING,
    };
  }
  return {
    sender: 'bot',
    type: 'text',
    text: `Analyse en cours concernant : "${query}". (Cette réponse sera bientôt générée par le backend Spring Boot connecté au LLM et à PostgreSQL.)`,
  };
}

export default function ChatWindow({ darkMode, setDarkMode }) {
  const [messages, setMessages] = useState([
    { sender: 'user', type: 'text', text: 'Qui est le meilleur candidat pour le poste de contrôleur financier ?' },
    {
      sender: 'bot',
      type: 'employee_ranking',
      text: "J'ai analysé les compétences requises du poste et les compétences actuellement enregistrées pour les employés.",
      data: CONTROLEUR_FINANCIER_RANKING,
    },
  ]);
  const [input, setInput] = useState('');
  const styles = getStyles(darkMode);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', type: 'text', text: input };
    const query = input;
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      setMessages((prev) => [...prev, mockAssistantReply(query)]);
    }, 700);
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div>
          <h3 style={styles.chatTitle}>Recherche de candidats — Contrôleur financier</h3>
          <p style={styles.chatSub}>Assistant <span style={styles.iaHighlightSmall}>RH</span> • Assistant intelligent d'aide à la décision RH</p>
        </div>
        <div style={styles.themeToggle}>
          <Sun 
            size={18} 
            color={!darkMode ? "#f59e0b" : "#94a3b8"} 
            style={{ cursor: 'pointer' }} 
            onClick={() => setDarkMode(false)} 
          />
          <Moon 
            size={18} 
            color={darkMode ? COLORS.violet : "#94a3b8"} 
            style={{ cursor: 'pointer' }} 
            onClick={() => setDarkMode(true)} 
          />
        </div>
      </div>

      <div style={styles.feed}>
        {messages.map((msg, i) => (
          <div key={i} style={{ ...styles.row, justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.sender === 'bot' && (
              <div style={styles.botIcon}>
                <Sparkles size={16} color="#ffffff" />
              </div>
            )}

            <div style={styles.messageColumn}>
              <div style={{ ...styles.bubble, ...(msg.sender === 'user' ? styles.userBubble : styles.botBubble) }}>
                {msg.text}
              </div>

              {msg.type === 'employee_ranking' && (
                <EmployeeRankingCard data={msg.data} darkMode={darkMode} />
              )}
            </div>

            {msg.sender === 'user' && (
              <div style={styles.userIcon}>
                <Smile size={18} color="#ffffff" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.chipsRow}>
        {SUGGESTIONS.map((s) => (
          <button key={s.label} style={styles.chip} onClick={() => setInput(s.prompt)}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={styles.inputContainer}>
        <div style={styles.inputWrapper}>
          <Paperclip size={18} color="#94a3b8" style={{ cursor: 'pointer' }} />
          <input
            type="text"
            placeholder="Écris un message à l'Assistant RH..."
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
        <p style={styles.disclaimer}>L'Assistant RH peut se tromper. Vérifiez les informations importantes avant toute décision.</p>
        <p style={styles.disclaimerStrong}>Les résultats présentés sont des aides à l'analyse et ne constituent pas une décision RH automatique.</p>
      </div>
    </div>
  );
}

const getStyles = (darkMode) => ({
  container: { flex: 1, height: '100vh', backgroundColor: darkMode ? COLORS.darkBg : '#ffffff', display: 'flex', flexDirection: 'column', color: darkMode ? '#ffffff' : '#0f172a', transition: 'all 0.3s' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0' },
  chatTitle: { margin: 0, fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a' },
  chatSub: { margin: 0, fontSize: '12px', color: '#94a3b8' },
  iaHighlightSmall: { fontWeight: '700', background: accentGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' },
  themeToggle: { display: 'flex', gap: '12px', backgroundColor: darkMode ? COLORS.darkSurface : '#f1f5f9', padding: '6px 12px', borderRadius: '20px', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', alignItems: 'center' },
  feed: { flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' },
  row: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  botIcon: { width: '32px', height: '32px', borderRadius: '50%', background: accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  userIcon: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  messageColumn: { display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '70%' },
  bubble: { padding: '14px 18px', borderRadius: '20px', fontSize: '14px', lineHeight: '1.6', width: 'fit-content', maxWidth: '100%' },
  botBubble: { backgroundColor: darkMode ? COLORS.darkSurface : '#f1f5f9', color: darkMode ? '#e2e8f0' : '#1e293b', border: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0', borderTopLeftRadius: '4px' },
  userBubble: { background: accentGradient, color: '#ffffff', borderTopRightRadius: '4px', marginLeft: 'auto' },
  chipsRow: { display: 'flex', gap: '10px', padding: '0 32px 12px 32px', flexWrap: 'wrap' },
  chip: { backgroundColor: darkMode ? COLORS.darkSurface : '#f1f5f9', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', color: darkMode ? '#cbd5e1' : '#475569', padding: '8px 16px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer' },
  inputContainer: { padding: '0 32px 24px 32px', textAlign: 'center' },
  inputWrapper: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: darkMode ? COLORS.darkSurface : '#f8fafc', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '28px' },
  input: { flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '14px' },
  sendBtn: { width: '36px', height: '36px', borderRadius: '50%', background: accentGradient, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  disclaimer: { fontSize: '11px', color: '#64748b', marginTop: '8px' },
  disclaimerStrong: { fontSize: '11px', color: darkMode ? '#a1a1aa' : '#64748b', marginTop: '2px', fontStyle: 'italic' },
});