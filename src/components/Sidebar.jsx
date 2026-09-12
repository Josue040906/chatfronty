import React from 'react';
import { MessageSquarePlus, FileSpreadsheet, Bot, History } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, history, onSelectChat, onNewChat }) {
  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <Bot size={28} color="#6366f1" />
        <h2 style={styles.title}>Assistant RH</h2>
      </div>

      <button style={styles.newBtn} onClick={onNewChat}>
        <MessageSquarePlus size={18} />
        <span>Nouvelle discussion</span>
      </button>

      <div style={styles.menu}>
        <p style={styles.sectionTitle}>Modules</p>
        <button 
          style={{ ...styles.menuItem, ...(activeTab === 'chat' ? styles.activeItem : {}) }}
          onClick={() => setActiveTab('chat')}
        >
          <History size={18} />
          <span>Discussion IA</span>
        </button>
        
        <button 
          style={{ ...styles.menuItem, ...(activeTab === 'excel' ? styles.activeItem : {}) }}
          onClick={() => setActiveTab('excel')}
        >
          <FileSpreadsheet size={18} />
          <span>Import Données Excel</span>
        </button>
      </div>

      <div style={styles.historyContainer}>
        <p style={styles.sectionTitle}>Historique Récents</p>
        {history.map((item) => (
          <div key={item.id} style={styles.historyItem} onClick={() => onSelectChat(item)}>
            <p style={styles.historyText}>{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  sidebar: { width: '260px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '16px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' },
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  title: { fontSize: '18px', fontWeight: 'bold', margin: 0 },
  newBtn: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', marginBottom: '20px' },
  menu: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' },
  sectionTitle: { fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', marginBottom: '8px' },
  menuItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', width: '100%' },
  activeItem: { backgroundColor: '#1e293b', color: '#f8fafc' },
  historyContainer: { flex: 1, overflowY: 'auto' },
  historyItem: { padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px', backgroundColor: '#1e293b' },
  historyText: { margin: 0, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
};