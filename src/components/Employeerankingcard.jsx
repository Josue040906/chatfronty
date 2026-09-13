import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { COLORS } from '../theme';

const MEDALS = ['🥇', '🥈', '🥉'];

function matchColor(match) {
  if (match >= 75) return COLORS.green;
  if (match >= 40) return COLORS.orange;
  return '#94a3b8';
}

// Rend une réponse structurée de type "employee_ranking" — un classement de
// candidats par rapport à un poste, avec le détail des compétences pour le
// candidat mis en avant. C'est un exemple concret du système de réponses
// typées (text / employee_ranking / employee_profile / competency_analysis)
// que le backend pourra produire une fois branché au LLM et à PostgreSQL.
export default function EmployeeRankingCard({ data, darkMode }) {
  const styles = getStyles(darkMode);
  const [expanded, setExpanded] = useState(
    () => new Set(data.candidates.filter((c) => c.defaultExpanded).map((c) => c.rank))
  );

  const toggle = (rank) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(rank) ? next.delete(rank) : next.add(rank);
      return next;
    });
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <p style={styles.poste}>{data.poste}</p>
        <p style={styles.subtitle}>Correspondance des compétences</p>
      </div>

      <div style={styles.list}>
        {data.candidates.map((c) => {
          const isExpanded = expanded.has(c.rank);
          const hasDetails = Array.isArray(c.competencies) && c.competencies.length > 0;

          return (
            <div key={c.rank} style={styles.candidate}>
              <div style={styles.candidateHeader}>
                <span style={styles.medal}>{MEDALS[c.rank - 1] || `#${c.rank}`}</span>
                <div style={styles.candidateInfo}>
                  <p style={styles.candidateName}>{c.name}</p>
                  <p style={styles.candidateRole}>{c.role}</p>
                </div>
                <span style={{ ...styles.matchBadge, color: matchColor(c.match), borderColor: matchColor(c.match) }}>
                  {c.match.toFixed(2).replace(/\.00$/, '')} %
                </span>
              </div>

              {hasDetails && isExpanded && (
                <div style={styles.competencyList}>
                  {c.competencies.map((comp) => (
                    <div key={comp.label} style={styles.competencyRow}>
                      {comp.ok ? (
                        <CheckCircle2 size={14} color={COLORS.green} />
                      ) : (
                        <AlertTriangle size={14} color={COLORS.orange} />
                      )}
                      <span style={styles.competencyLabel}>{comp.label}</span>
                      <span style={styles.competencyRatio}>{comp.niveau} / {comp.requis}</span>
                    </div>
                  ))}

                  {data.requiredCount != null && (
                    <p style={styles.source}>
                      Basé sur : {data.requiredCount} compétences requises
                      {data.dataDate ? ` • données RH du ${data.dataDate}` : ''}
                    </p>
                  )}
                </div>
              )}

              {hasDetails && (
                <button style={styles.detailBtn} onClick={() => toggle(c.rank)}>
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  <span>{isExpanded ? 'Masquer le détail' : 'Voir le détail'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const getStyles = (darkMode) => ({
  card: { backgroundColor: darkMode ? '#1E1733' : '#ffffff', border: darkMode ? '1px solid #2D2350' : '1px solid #e2e8f0', borderRadius: '18px', padding: '18px', maxWidth: '440px', marginTop: '4px' },
  header: { marginBottom: '12px' },
  poste: { margin: 0, fontSize: '14px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0f172a' },
  subtitle: { margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  candidate: { border: darkMode ? '1px solid #2D2350' : '1px solid #eef1f6', borderRadius: '14px', padding: '12px 14px', backgroundColor: darkMode ? '#211935' : '#f8fafc' },
  candidateHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
  medal: { fontSize: '18px', width: '22px', textAlign: 'center', flexShrink: 0 },
  candidateInfo: { flex: 1, minWidth: 0 },
  candidateName: { margin: 0, fontSize: '13.5px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a' },
  candidateRole: { margin: 0, fontSize: '11.5px', color: '#94a3b8' },
  matchBadge: { fontSize: '12.5px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', border: '1.5px solid', whiteSpace: 'nowrap' },
  competencyList: { marginTop: '10px', paddingTop: '10px', borderTop: darkMode ? '1px solid #2D2350' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' },
  competencyRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: darkMode ? '#e2e8f0' : '#334155' },
  competencyLabel: { flex: 1 },
  competencyRatio: { fontSize: '11.5px', color: '#94a3b8', fontWeight: '600' },
  source: { margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' },
  detailBtn: { display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px', background: 'transparent', border: 'none', color: COLORS.violet, fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 },
});