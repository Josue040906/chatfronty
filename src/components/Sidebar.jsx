import React from 'react';
import { Sparkles, Plus, MessageSquare, Database } from 'lucide-react';
import { COLORS, accentGradient } from '../theme';

export default function Sidebar({ activeTab, setActiveTab, history, onSelectChat, onNewChat, darkMode }) {
  const styles = getStyles(darkMode);

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>
        <div style={styles.logoBadge}>
          <Sparkles size={20} color="#ffffff" />
        </div>
        <h2 style={styles.title}>Assistant <span style={styles.iaHighlight}>RH</span></h2>
      </div>

      <button style={styles.newBtn} onClick={onNewChat}>
        <Plus size={18} />
        <span>Nouvelle discussion</span>
      </button>

      <div style={styles.menu}>
        <p style={styles.sectionTitle}>Modules</p>
        <button 
          style={{ ...styles.menuItem, ...(activeTab === 'chat' ? styles.activeItem : {}) }}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          <span>Assistant RH</span>
        </button>
        
        <button 
          style={{ ...styles.menuItem, ...(activeTab === 'crud' ? styles.activeItem : {}) }}
          onClick={() => setActiveTab('crud')}
        >
          <Database size={16} />
          <span>Données RH</span>
        </button>
      </div>

      <div style={styles.historyContainer}>
        <p style={styles.sectionTitle}>Aujourd'hui</p>
        {history.slice(0, 3).map((item) => (
          <div key={item.id} style={styles.historyItem} onClick={() => onSelectChat(item)}>
            <span style={styles.dot}>•</span>
            <p style={styles.historyText}>{item.title}</p>
          </div>
        ))}

        <p style={{ ...styles.sectionTitle, marginTop: '16px' }}>Hier</p>
        {history.slice(3).map((item) => (
          <div key={item.id} style={styles.historyItem} onClick={() => onSelectChat(item)}>
            <span style={styles.dot}>•</span>
            <p style={styles.historyText}>{item.title}</p>
          </div>
        ))}
      </div>

      <div style={styles.userFooter}>
        <div style={styles.avatar}>SR</div>
        <div style={styles.userInfo}>
          <p style={styles.userName}>Sofia R.</p>
          <p style={styles.userPlan}>Plan Essentiel</p>
        </div>
      </div>
    </aside>
  );
}

const getStyles = (darkMode) => ({
  sidebar: { width: '280px', backgroundColor: darkMode ? '#211935' : '#f1f5f9', color: darkMode ? '#e2e8f0' : '#1e293b', padding: '20px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box', borderRight: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', transition: 'all 0.3s' },
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
  logoBadge: { width: '36px', height: '36px', borderRadius: '50%', background: accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: '22px', fontWeight: 'bold', margin: 0, color: darkMode ? '#ffffff' : '#0f172a', letterSpacing: '0.5px' },
  iaHighlight: { fontWeight: '800', background: accentGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' },
  newBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: 'transparent', border: darkMode ? '1px solid #4c3870' : '1px solid #cbd5e1', color: darkMode ? '#ffffff' : '#0f172a', borderRadius: '24px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', marginBottom: '24px', transition: 'all 0.2s' },
  menu: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' },
  sectionTitle: { fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600', marginBottom: '10px', paddingLeft: '8px' },
  menuItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: 'transparent', color: darkMode ? '#cbd5e1' : '#475569', border: 'none', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: '14px' },
  activeItem: { backgroundColor: darkMode ? '#322550' : '#e2e8f0', color: darkMode ? '#ffffff' : '#0f172a', fontWeight: '600' },
  historyContainer: { flex: 1, overflowY: 'auto' },
  historyItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', color: darkMode ? '#cbd5e1' : '#334155' },
  dot: { color: COLORS.violet, fontSize: '18px' },
  historyText: { margin: 0, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userFooter: { display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1' },
  avatar: { width: '38px', height: '38px', borderRadius: '50%', background: accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { margin: 0, fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a' },
  userPlan: { margin: 0, fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b' }
});