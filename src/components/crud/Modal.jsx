import { X } from 'lucide-react';

// FenÃªtre gÃ©nÃ©rique (fond + carte centrÃ©e) rÃ©utilisÃ©e pour l'Ã©dition, la
// confirmation de suppression et les fiches "DÃ©tails". Reprend exactement les
// couleurs, rayons et bordures dÃ©jÃ  utilisÃ©s dans le module CRUD.
export default function Modal({ darkMode, title, onClose, children, maxWidth = '480px' }) {
  const styles = getStyles(darkMode, maxWidth);
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button style={styles.closeBtn} onClick={onClose} title="Fermer">
            <X size={16} />
          </button>
        </div>
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

const getStyles = (darkMode, maxWidth) => ({
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 18, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' },
  card: { width: '100%', maxWidth, maxHeight: '85vh', overflowY: 'auto', backgroundColor: darkMode ? '#2B1B14' : '#ffffff', border: darkMode ? '1px solid #43281C' : '1px solid #e2e8f0', borderRadius: '18px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: darkMode ? '1px solid #43281C' : '1px solid #e2e8f0' },
  title: { margin: 0, fontSize: '15px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0f172a' },
  closeBtn: { width: '30px', height: '30px', borderRadius: '10px', border: 'none', background: 'transparent', color: darkMode ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  body: { padding: '20px 22px' },
});

