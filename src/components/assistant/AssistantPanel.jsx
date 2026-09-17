import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, X, Maximize2, Minimize2, ChevronRight } from 'lucide-react';
import { COLORS, accentGradient } from '../../theme';
import { employeLabel } from '../../crudSchema';

const SIZES = ['small', 'wide', 'full'];
const SIZE_WIDTH = { small: '380px', wide: '560px', full: '100vw' };

const SUGGESTIONS = [
  'Affiche les agents du SGEAE',
  'Combien d\u2019agents par service ?',
  'Ouvre la fiche de Jean RAKOTO',
];

// Panneau conversationnel intégré à l'application : l'utilisateur continue de
// consulter les écrans pendant qu'il dialogue. L'assistant peut répondre par du
// texte, mais aussi déclencher une action dans l'interface (ouvrir une
// rubrique, ouvrir une fiche) — c'est ce qui le rend natif plutôt qu'ajouté
// à côté. La compréhension réelle viendra du backend (Spring Boot + LLM) ;
// ici seule la mécanique d'affichage et d'action est en place.
export default function AssistantPanel({ open, onOpen, onClose, tables, onNavigate, onOpenRecord, darkMode }) {
  const [size, setSize] = useState('small');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Bonjour. Posez-moi une question sur les agents, les services ou vos tâches — je peux aussi ouvrir directement un écran pour vous." },
  ]);
  const feedRef = useRef(null);
  const styles = getStyles(darkMode, size);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages, open]);

  const cycleSize = () => setSize((s) => SIZES[(SIZES.indexOf(s) + 1) % SIZES.length]);

  const send = (text) => {
    const query = (text ?? input).trim();
    if (!query) return;
    setMessages((m) => [...m, { role: 'user', text: query }]);
    setInput('');
    setTimeout(() => {
      const reply = interpret(query, tables, { onNavigate, onOpenRecord });
      setMessages((m) => [...m, reply]);
    }, 450);
  };

  if (!open) {
    return (
      <button style={styles.launcher} onClick={onOpen} title="Ouvrir l'assistant">
        <Sparkles size={17} />
        <span>Assistant</span>
      </button>
    );
  }

  return (
    <aside style={styles.panel}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}><Sparkles size={15} color="#fff" /></span>
          <div>
            <p style={styles.name}>Assistant</p>
            <p style={styles.status}>Connecté aux données RH</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.iconBtn} onClick={cycleSize} title="Changer la taille">
            {size === 'full' ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button style={styles.iconBtn} onClick={onClose} title="Fermer">
            <X size={16} />
          </button>
        </div>
      </header>

      <div style={styles.feed} ref={feedRef}>
        {messages.map((msg, i) => (
          <div key={i} style={msg.role === 'user' ? styles.userRow : styles.botRow}>
            <div style={msg.role === 'user' ? styles.userBubble : styles.botBubble}>
              {msg.text}
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
                  <button key={item.id} style={styles.resultItem} onClick={item.onClick}>
                    <span style={styles.resultLabel}>{item.label}</span>
                    {item.meta && <span style={styles.resultMeta}>{item.meta}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <button key={s} style={styles.chip} onClick={() => send(s)}>{s}</button>
        ))}
      </div>

      <div style={styles.composer}>
        <input
          style={styles.input}
          placeholder="Écrivez votre demande..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button style={styles.sendBtn} onClick={() => send()}>
          <Send size={15} color="#fff" />
        </button>
      </div>
      <p style={styles.disclaimer}>
        Aide à l'analyse — ne constitue pas une décision RH automatique.
      </p>
    </aside>
  );
}

// Interprétation locale provisoire : reconnaît quelques intentions pour
// démontrer le lien entre la conversation et l'interface. Elle sera remplacée
// par les appels /api/chat du backend, qui décidera de l'outil à utiliser.
function interpret(query, tables, { onNavigate, onOpenRecord }) {
  const q = query.toLowerCase();

  // « Ouvre la fiche de X »
  const agent = tables.employe.rows.find((a) => {
    const full = employeLabel(a).toLowerCase();
    return q.includes(a.nom.toLowerCase()) || q.includes(full);
  });
  if (agent && (q.includes('fiche') || q.includes('ouvre') || q.includes('affiche'))) {
    return {
      role: 'assistant',
      text: `Voici la fiche de ${employeLabel(agent)} (${agent.matricule}).`,
      action: { label: 'Ouvrir la fiche', run: () => onOpenRecord('employe', agent.id) },
    };
  }

  // « Affiche les agents du <service> » / « combien d'agents dans <service> »
  const service = tables.service.rows.find((s) => q.includes(s.nom.toLowerCase()));
  if (service) {
    const list = tables.employe.rows.filter((a) => a.service_id === service.id);
    if (q.includes('combien') || q.includes('nombre')) {
      return { role: 'assistant', text: `${list.length} agent${list.length > 1 ? 's' : ''} ${list.length > 1 ? 'travaillent' : 'travaille'} au service « ${service.nom} ».` };
    }
    return {
      role: 'assistant',
      text: `J'ai trouvé ${list.length} agent${list.length > 1 ? 's' : ''} rattaché${list.length > 1 ? 's' : ''} à « ${service.nom} ».`,
      list: list.map((a) => ({
        id: a.id,
        label: employeLabel(a),
        meta: a.matricule,
        onClick: () => onOpenRecord('employe', a.id),
      })),
    };
  }

  // « Combien d'agents par service »
  if (q.includes('par service')) {
    return {
      role: 'assistant',
      text: 'Voici la répartition des agents par service.',
      list: tables.service.rows.map((s) => ({
        id: s.id,
        label: s.nom,
        meta: `${tables.employe.rows.filter((a) => a.service_id === s.id).length} agents`,
        onClick: () => onNavigate('service'),
      })),
    };
  }

  if (q.includes('tâche') || q.includes('tache')) {
    return {
      role: 'assistant',
      text: 'Vos tâches sont regroupées dans la rubrique Tâches.',
      action: { label: 'Ouvrir mes tâches', run: () => onNavigate('tache') },
    };
  }

  if (q.includes('agent')) {
    return {
      role: 'assistant',
      text: `Le ministère compte actuellement ${tables.employe.rows.length} agents enregistrés.`,
      action: { label: 'Voir la liste des agents', run: () => onNavigate('employe') },
    };
  }

  return {
    role: 'assistant',
    text: "Je n'ai pas encore la capacité de traiter cette demande. Une fois connecté au backend, je pourrai interroger la base et déclencher l'action correspondante.",
  };
}

const getStyles = (darkMode, size) => ({
  launcher: { position: 'fixed', left: '20px', bottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderRadius: '999px', border: 'none', background: accentGradient, color: '#fff', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 30px rgba(124, 92, 250, 0.4)', zIndex: 80 },

  panel: { position: 'fixed', left: 0, bottom: 0, top: size === 'full' ? 0 : 'auto', height: size === 'full' ? '100vh' : '78vh', width: SIZE_WIDTH[size], maxWidth: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: darkMode ? COLORS.darkSurface : '#ffffff', borderRight: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', borderTop: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', borderTopRightRadius: size === 'full' ? 0 : '18px', boxShadow: '0 -8px 40px rgba(0,0,0,0.25)', zIndex: 90 },

  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  logo: { width: '30px', height: '30px', borderRadius: '9px', background: accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  name: { margin: 0, fontSize: '13.5px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0f172a' },
  status: { margin: 0, fontSize: '11px', color: COLORS.green },
  headerActions: { display: 'flex', gap: '4px' },
  iconBtn: { width: '30px', height: '30px', borderRadius: '9px', border: 'none', background: 'transparent', color: darkMode ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },

  feed: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  botRow: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', maxWidth: '92%' },
  userRow: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', maxWidth: '92%', alignSelf: 'flex-end' },
  botBubble: { padding: '11px 14px', borderRadius: '14px', borderTopLeftRadius: '4px', backgroundColor: darkMode ? '#211935' : '#f1f5f9', color: darkMode ? '#e2e8f0' : '#1e293b', fontSize: '13.5px', lineHeight: 1.55 },
  userBubble: { padding: '11px 14px', borderRadius: '14px', borderTopRightRadius: '4px', background: accentGradient, color: '#fff', fontSize: '13.5px', lineHeight: 1.55 },
  actionBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${COLORS.violet}`, background: 'transparent', color: COLORS.violet, fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' },

  resultList: { display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' },
  resultItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '9px 12px', borderRadius: '10px', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', backgroundColor: darkMode ? '#211935' : '#f8fafc', cursor: 'pointer', textAlign: 'left' },
  resultLabel: { fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a' },
  resultMeta: { fontSize: '11px', color: '#94a3b8' },

  suggestions: { display: 'flex', gap: '6px', padding: '0 16px 10px', flexWrap: 'wrap', flexShrink: 0 },
  chip: { padding: '6px 11px', borderRadius: '999px', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', backgroundColor: 'transparent', color: darkMode ? '#cbd5e1' : '#475569', fontSize: '11.5px', cursor: 'pointer' },

  composer: { display: 'flex', alignItems: 'center', gap: '8px', margin: '0 16px', padding: '6px 6px 6px 14px', borderRadius: '999px', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #cbd5e1', backgroundColor: darkMode ? COLORS.darkBg : '#f8fafc', flexShrink: 0 },
  input: { flex: 1, border: 'none', outline: 'none', background: 'transparent', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '13.5px' },
  sendBtn: { width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  disclaimer: { fontSize: '10.5px', color: '#94a3b8', textAlign: 'center', margin: '8px 16px 12px', flexShrink: 0 },
});