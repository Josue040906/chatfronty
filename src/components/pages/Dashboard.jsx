import React from 'react';
import { Users, Building2, Network, ClipboardList } from 'lucide-react';
import { COLORS, accentGradient } from '../../theme';
import { CURRENT_USER_ID } from '../../crudSchema';

const STATUT_COLOR = {
  'À faire': '#94a3b8',
  'En cours': COLORS.violet,
  'Terminée': COLORS.green,
  'Annulée': '#ef4444',
};

const PRIORITE_COLOR = {
  Haute: COLORS.orange,
  Normale: COLORS.blue,
  Basse: '#94a3b8',
};

// Tableau de bord : indicateurs de synthèse, répartition des agents par
// service, et tâches de l'agent connecté. Toutes les valeurs sont calculées
// à partir des données, jamais saisies en dur.
export default function Dashboard({ tables, onNavigate, onOpenRecord, darkMode }) {
  const styles = getStyles(darkMode);

  const agents = tables.employe.rows;
  const services = tables.service.rows;
  const directions = tables.direction.rows;
  const myTasks = tables.tache.rows.filter((t) => t.employe_id === CURRENT_USER_ID);
  const openTasks = myTasks.filter((t) => t.statut === 'À faire' || t.statut === 'En cours');

  // Répartition des agents par service, triée par effectif décroissant.
  const perService = services
    .map((s) => ({ service: s, count: agents.filter((a) => a.service_id === s.id).length }))
    .sort((a, b) => b.count - a.count);
  const maxCount = Math.max(1, ...perService.map((p) => p.count));

  const kpis = [
    { label: 'Agents', value: agents.length, icon: Users, section: 'employe' },
    { label: 'Services', value: services.length, icon: Building2, section: 'service' },
    { label: 'Directions', value: directions.length, icon: Network, section: 'direction' },
    { label: 'Mes tâches en cours', value: openTasks.length, icon: ClipboardList, section: 'tache' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Tableau de bord</h1>
          <p style={styles.subtitle}>Vue d'ensemble des effectifs et de l'organisation</p>
        </div>
      </div>

      <div style={styles.kpiGrid}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button key={kpi.label} style={styles.kpiCard} onClick={() => onNavigate(kpi.section)}>
              <span style={styles.kpiIcon}><Icon size={18} /></span>
              <span style={styles.kpiValue}>{kpi.value}</span>
              <span style={styles.kpiLabel}>{kpi.label}</span>
            </button>
          );
        })}
      </div>

      <div style={styles.columns}>
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Agents par service</h2>
            <span style={styles.cardMeta}>{agents.length} agents au total</span>
          </div>

          <div style={styles.chart}>
            {perService.map(({ service, count }) => (
              <div key={service.id} style={styles.barRow}>
                <span style={styles.barLabel} title={service.nom}>{service.nom}</span>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, width: `${(count / maxCount) * 100}%` }} />
                </div>
                <span style={styles.barValue}>{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Mes tâches</h2>
            <button style={styles.linkBtn} onClick={() => onNavigate('tache')}>Tout voir</button>
          </div>

          {myTasks.length === 0 ? (
            <p style={styles.empty}>Aucune tâche ne vous est attribuée.</p>
          ) : (
            <div style={styles.taskList}>
              {myTasks.map((task) => (
                <button key={task.id} style={styles.taskItem} onClick={() => onOpenRecord('tache', task.id)}>
                  <span style={{ ...styles.statutDot, backgroundColor: STATUT_COLOR[task.statut] || '#94a3b8' }} />
                  <div style={styles.taskBody}>
                    <p style={styles.taskTitle}>{task.titre}</p>
                    <div style={styles.taskMetaRow}>
                      <span style={{ ...styles.tag, color: STATUT_COLOR[task.statut], borderColor: STATUT_COLOR[task.statut] }}>{task.statut}</span>
                      <span style={{ ...styles.tag, color: PRIORITE_COLOR[task.priorite], borderColor: PRIORITE_COLOR[task.priorite] }}>{task.priorite}</span>
                      <span style={styles.echeance}>{formatDate(task.echeance)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const getStyles = (darkMode) => ({
  page: { padding: '24px 28px', overflowY: 'auto', flex: 1 },
  headerRow: { marginBottom: '20px' },
  title: { margin: 0, fontSize: '22px', fontWeight: '800', color: darkMode ? '#ffffff' : '#0f172a' },
  subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' },

  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' },
  kpiCard: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', padding: '18px', borderRadius: '16px', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', backgroundColor: darkMode ? COLORS.darkSurface : '#ffffff', cursor: 'pointer', textAlign: 'left' },
  kpiIcon: { width: '34px', height: '34px', borderRadius: '10px', background: accentGradient, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' },
  kpiValue: { fontSize: '26px', fontWeight: '800', color: darkMode ? '#ffffff' : '#0f172a', lineHeight: 1 },
  kpiLabel: { fontSize: '12.5px', color: '#94a3b8', fontWeight: '600' },

  columns: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: '16px', alignItems: 'start' },
  card: { backgroundColor: darkMode ? COLORS.darkSurface : '#ffffff', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  cardTitle: { margin: 0, fontSize: '15px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0f172a' },
  cardMeta: { fontSize: '12px', color: '#94a3b8' },
  linkBtn: { background: 'transparent', border: 'none', color: COLORS.violet, fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' },

  chart: { display: 'flex', flexDirection: 'column', gap: '12px' },
  barRow: { display: 'grid', gridTemplateColumns: 'minmax(0, 150px) 1fr 28px', alignItems: 'center', gap: '12px' },
  barLabel: { fontSize: '12.5px', color: darkMode ? '#e2e8f0' : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  barTrack: { height: '10px', borderRadius: '6px', backgroundColor: darkMode ? '#211935' : '#f1f5f9', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '6px', background: accentGradient, minWidth: '4px' },
  barValue: { fontSize: '12.5px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0f172a', textAlign: 'right' },

  taskList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  taskItem: { display: 'flex', gap: '10px', padding: '12px', borderRadius: '12px', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #eef2f7', backgroundColor: darkMode ? '#211935' : '#f8fafc', cursor: 'pointer', textAlign: 'left', width: '100%' },
  statutDot: { width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', flexShrink: 0 },
  taskBody: { flex: 1, minWidth: 0 },
  taskTitle: { margin: 0, fontSize: '13px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a' },
  taskMetaRow: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' },
  tag: { fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', border: '1px solid' },
  echeance: { fontSize: '11px', color: '#94a3b8' },
  empty: { fontSize: '13px', color: '#94a3b8', margin: 0 },
});