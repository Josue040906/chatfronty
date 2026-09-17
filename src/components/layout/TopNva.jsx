import React, { useState } from 'react';
import { Bell, Sun, Moon, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { COLORS, accentGradient } from '../../theme';
import { NAV_SECTIONS } from '../../crudSchema';

// Barre de navigation horizontale de l'application : identité à gauche,
// rubriques au centre, notifications / thème / profil à droite.
export default function TopNav({ activeSection, onNavigate, notifications, onMarkAllRead, currentUser, darkMode, setDarkMode }) {
  const styles = getStyles(darkMode);
  const [openPanel, setOpenPanel] = useState(null); // 'notif' | 'profile' | null
  const unread = notifications.filter((n) => !n.lue).length;

  const toggle = (panel) => setOpenPanel((p) => (p === panel ? null : panel));
  const initials = `${currentUser.prenom?.[0] || ''}${currentUser.nom?.[0] || ''}`.toUpperCase();

  return (
    <header style={styles.nav}>
      <div style={styles.brandZone}>
        <div style={styles.logo}>MEF</div>
        <div>
          <p style={styles.appName}>Gestion RH</p>
          <p style={styles.appSub}>Ministère de l'Économie et des Finances</p>
        </div>
      </div>

      <nav style={styles.sections}>
        {NAV_SECTIONS.map((section) => (
          <button
            key={section.key}
            onClick={() => onNavigate(section.key)}
            style={{ ...styles.tab, ...(activeSection === section.key ? styles.tabActive : {}) }}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <div style={styles.actions}>
        <button style={styles.iconBtn} onClick={() => setDarkMode(!darkMode)} title="Changer de thème">
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div style={styles.relative}>
          <button style={styles.iconBtn} onClick={() => toggle('notif')} title="Notifications">
            <Bell size={17} />
            {unread > 0 && <span style={styles.badge}>{unread}</span>}
          </button>

          {openPanel === 'notif' && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownHeader}>
                <span style={styles.dropdownTitle}>Notifications</span>
                {unread > 0 && (
                  <button style={styles.linkBtn} onClick={onMarkAllRead}>Tout marquer comme lu</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p style={styles.empty}>Aucune notification.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} style={{ ...styles.notifItem, ...(n.lue ? {} : styles.notifUnread) }}>
                    {!n.lue && <span style={styles.dot} />}
                    <div style={{ flex: 1 }}>
                      <p style={styles.notifText}>{n.message}</p>
                      <p style={styles.notifDate}>{formatDate(n.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div style={styles.relative}>
          <button style={styles.profileBtn} onClick={() => toggle('profile')}>
            <span style={styles.avatar}>{initials}</span>
            <span style={styles.profileName}>{currentUser.prenom} {currentUser.nom}</span>
            <ChevronDown size={14} />
          </button>

          {openPanel === 'profile' && (
            <div style={styles.dropdown}>
              <div style={styles.profileHeader}>
                <span style={styles.avatarLarge}>{initials}</span>
                <div>
                  <p style={styles.profileFullName}>{currentUser.prenom} {currentUser.nom}</p>
                  <p style={styles.profileMeta}>{currentUser.matricule}</p>
                </div>
              </div>
              <button style={styles.menuRow}><User size={15} /> Mon profil</button>
              <button style={styles.menuRow}><Settings size={15} /> Paramètres</button>
              <button style={styles.menuRow}><LogOut size={15} /> Se déconnecter</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const getStyles = (darkMode) => ({
  nav: { display: 'flex', alignItems: 'center', gap: '20px', padding: '10px 20px', borderBottom: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', backgroundColor: darkMode ? COLORS.darkSurface : '#ffffff', flexShrink: 0 },
  brandZone: { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  logo: { width: '38px', height: '38px', borderRadius: '10px', background: accentGradient, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', letterSpacing: '0.5px' },
  appName: { margin: 0, fontSize: '14px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0f172a', lineHeight: 1.2 },
  appSub: { margin: 0, fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.3 },

  sections: { display: 'flex', gap: '2px', flex: 1, overflowX: 'auto', justifyContent: 'center' },
  tab: { padding: '8px 13px', borderRadius: '9px', border: 'none', background: 'transparent', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  tabActive: { backgroundColor: darkMode ? '#2d234a' : '#eef2ff', color: darkMode ? '#ffffff' : COLORS.violetDeep },

  actions: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  relative: { position: 'relative' },
  iconBtn: { position: 'relative', width: '36px', height: '36px', borderRadius: '10px', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', background: 'transparent', color: darkMode ? '#e2e8f0' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  badge: { position: 'absolute', top: '-5px', right: '-5px', minWidth: '17px', height: '17px', borderRadius: '9px', backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' },

  profileBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px 5px 5px', borderRadius: '10px', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', background: 'transparent', color: darkMode ? '#e2e8f0' : '#334155', cursor: 'pointer' },
  avatar: { width: '26px', height: '26px', borderRadius: '8px', background: accentGradient, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' },
  profileName: { fontSize: '12.5px', fontWeight: '600', whiteSpace: 'nowrap' },

  dropdown: { position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '320px', maxHeight: '380px', overflowY: 'auto', backgroundColor: darkMode ? COLORS.darkSurface : '#ffffff', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.25)', zIndex: 60, padding: '8px' },
  dropdownHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 10px' },
  dropdownTitle: { fontSize: '13px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0f172a' },
  linkBtn: { background: 'transparent', border: 'none', color: COLORS.violet, fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' },
  notifItem: { display: 'flex', gap: '8px', padding: '10px', borderRadius: '10px', marginBottom: '2px' },
  notifUnread: { backgroundColor: darkMode ? '#211935' : '#f8fafc' },
  dot: { width: '7px', height: '7px', borderRadius: '50%', backgroundColor: COLORS.violet, marginTop: '5px', flexShrink: 0 },
  notifText: { margin: 0, fontSize: '12.5px', lineHeight: 1.45, color: darkMode ? '#e2e8f0' : '#334155' },
  notifDate: { margin: '3px 0 0', fontSize: '11px', color: '#94a3b8' },
  empty: { fontSize: '12.5px', color: '#94a3b8', padding: '10px', margin: 0 },

  profileHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', marginBottom: '6px', borderBottom: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', paddingBottom: '12px' },
  avatarLarge: { width: '38px', height: '38px', borderRadius: '11px', background: accentGradient, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' },
  profileFullName: { margin: 0, fontSize: '13.5px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0f172a' },
  profileMeta: { margin: '2px 0 0', fontSize: '11.5px', color: '#94a3b8' },
  menuRow: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: 'transparent', color: darkMode ? '#e2e8f0' : '#334155', fontSize: '13px', cursor: 'pointer', textAlign: 'left' },
});