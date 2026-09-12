import React from 'react';
import { Sparkles, Plus, MessageSquare, Database, Moon, Sun } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, history, onSelectChat, onNewChat }) {
  return (
    <aside style={styles.sidebar}>
      {/* Brand Logo */}
      <div style={styles.header}>
        <div style={styles.logoBadge}>
          <Sparkles size={20} color="#ffffff" />
        </div>
        <h2 style={styles.title}>Nova</h2>
      </div>

      {/* Action Button */}
      <button style={styles.newBtn} onClick={onNewChat}>
        <Plus size={18} />
        <span>Nouvelle discussion</span>
      </button>

      {/* Navigation Modules */}
      <div style={styles.menu}>
        <p style={styles.sectionTitle}>Modules</p>
        <button 
          style={{ ...styles.menuItem, ...(activeTab === 'chat' ? styles.activeItem : {}) }}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          <span>Assistant IA</span>
        </button>
        
        <button 
          style={{ ...styles.menuItem, ...(activeTab === 'crud' ? styles.activeItem : {}) }}
          onClick={() => setActiveTab('crud')}
        >
          <Database size={16} />
          <span>Gestion RH & Data</span>
        </button>
      </div>

      {/* Recent History */}
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

      {/* User Profile Footer */}
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

const styles = {
  sidebar: { width: '280px', backgroundColor: '#211935', color: '#e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box', borderRight: '1px solid #2d234a' },
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
  logoBadge: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#ffffff', letterSpacing: '0.5px' },
  newBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: 'transparent', border: '1px solid #4c3870', color: '#ffffff', borderRadius: '24px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', marginBottom: '24px', transition: 'all 0.2s' },
  menu: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' },
  sectionTitle: { fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '10px', paddingLeft: '8px' },
  menuItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: 'transparent', color: '#cbd5e1', border: 'none', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: '14px' },
  activeItem: { backgroundColor: '#322550', color: '#ffffff', fontWeight: '600' },
  historyContainer: { flex: 1, overflowY: 'auto' },
  historyItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', color: '#cbd5e1' },
  dot: { color: '#ec4899', fontSize: '18px' },
  historyText: { margin: 0, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userFooter: { display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid #2d234a' },
  avatar: { width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #e85d9a, #5c7cfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { margin: 0, fontSize: '14px', fontWeight: '600', color: '#ffffff' },
  userPlan: { margin: 0, fontSize: '12px', color: '#94a3b8' }
};