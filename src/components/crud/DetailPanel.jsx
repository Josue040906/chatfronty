import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DETAIL_CONFIG } from '../../crudSchema';
import { COLORS, accentGradient } from '../../theme';

// Contenu de la fiche "Détails" : identité de l'enregistrement + ses relations.
// Les relations éditables (ex. compétences d'un employé) se gèrent ici,
// directement, sans jamais montrer à l'utilisateur la table de jonction brute
// (employe_competence, poste_competence, domaine_competence_relation).
export default function DetailPanel({ tableKey, row, tables, updateJunction, darkMode }) {
  const config = DETAIL_CONFIG[tableKey];
  const styles = getStyles(darkMode);
  if (!config) return null;

  return (
    <div>
      <div style={styles.identity}>
        <p style={styles.identityTitle}>{config.title(row)}</p>
        {config.subtitle && config.subtitle(row) && <p style={styles.identitySubtitle}>{config.subtitle(row)}</p>}
      </div>

      {(config.editableRelations || []).map((rel) => (
        <EditableRelation key={rel.title} rel={rel} row={row} tables={tables} updateJunction={updateJunction} darkMode={darkMode} styles={styles} />
      ))}

      {(config.logRelations || []).map((rel) => (
        <LogRelation key={rel.title} rel={rel} row={row} tables={tables} updateJunction={updateJunction} darkMode={darkMode} styles={styles} />
      ))}

      {(config.readonlyRelations || []).map((rel) => (
        <ReadonlyRelation key={rel.title} rel={rel} row={row} tables={tables} styles={styles} />
      ))}
    </div>
  );
}

function EditableRelation({ rel, row, tables, updateJunction, darkMode, styles }) {
  const [selected, setSelected] = useState('');
  const [extraValue, setExtraValue] = useState(rel.extraField ? rel.extraField.default : null);

  const junctionRows = tables[rel.junctionTable].rows.filter((r) => r[rel.ownerField] === row.id);
  const otherRows = tables[rel.otherTable].rows;
  const linkedIds = new Set(junctionRows.map((r) => r[rel.otherField]));
  const availableOptions = otherRows.filter((r) => !linkedIds.has(r.id));

  const handleAdd = () => {
    if (!selected) return;
    const extra = rel.extraField ? { [rel.extraField.key]: Number(extraValue) } : {};
    updateJunction(rel.junctionTable, (t) => {
      const nextId = t.rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
      return { ...t, rows: [...t.rows, { id: nextId, [rel.ownerField]: row.id, [rel.otherField]: Number(selected), ...extra }] };
    });
    setSelected('');
    if (rel.extraField) setExtraValue(rel.extraField.default);
  };

  const handleRemove = (junctionRowId) => {
    updateJunction(rel.junctionTable, (t) => ({ ...t, rows: t.rows.filter((r) => r.id !== junctionRowId) }));
  };

  return (
    <div style={styles.section}>
      <p style={styles.sectionTitle}>{rel.title}</p>

      {junctionRows.length === 0 && <p style={styles.emptyText}>Aucune donnée pour le moment.</p>}

      <div style={styles.relationList}>
        {junctionRows.map((jr) => {
          const otherRow = otherRows.find((r) => r.id === jr[rel.otherField]);
          return (
            <div key={jr.id} style={styles.relationItem}>
              <span style={styles.relationLabel}>{otherRow ? rel.getOtherLabel(otherRow) : '—'}</span>
              {rel.extraField && <span style={styles.relationBadge}>{jr[rel.extraField.key]}</span>}
              <button style={styles.removeBtn} onClick={() => handleRemove(jr.id)} title="Retirer">
                <Trash2 size={13} color={COLORS.pink} />
              </button>
            </div>
          );
        })}
      </div>

      <div style={styles.addRow}>
        <select style={styles.addSelect} value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">— Ajouter —</option>
          {availableOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{rel.getOtherLabel(opt)}</option>
          ))}
        </select>
        {rel.extraField && (
          <input
            type="number"
            min={rel.extraField.min}
            max={rel.extraField.max}
            style={styles.addNumber}
            value={extraValue ?? ''}
            onChange={(e) => setExtraValue(e.target.value)}
            title={rel.extraField.label}
          />
        )}
        <button style={styles.addBtn} onClick={handleAdd} disabled={!selected} title="Ajouter">
          <Plus size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}

// Historique de carrière : contrairement aux compétences (qui pointent vers
// une autre table), chaque ligne est une saisie libre à plusieurs champs
// (date, événement, situation avant/après). On peut en ajouter et en
// supprimer, mais jamais les modifier après coup — un historique ne s'édite
// pas, il se complète.
function LogRelation({ rel, row, tables, updateJunction, darkMode, styles }) {
  const blank = {};
  rel.fields.forEach((f) => (blank[f.key] = ''));
  const [draft, setDraft] = useState(blank);

  const entries = tables[rel.table].rows
    .filter((r) => r[rel.ownerField] === row.id)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const canAdd = rel.fields.every((f) => String(draft[f.key] || '').trim() !== '');

  const handleAdd = () => {
    if (!canAdd) return;
    updateJunction(rel.table, (t) => {
      const nextId = t.rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
      return { ...t, rows: [...t.rows, { id: nextId, [rel.ownerField]: row.id, ...draft }] };
    });
    setDraft(blank);
  };

  const handleRemove = (id) => {
    updateJunction(rel.table, (t) => ({ ...t, rows: t.rows.filter((r) => r.id !== id) }));
  };

  return (
    <div style={styles.section}>
      <p style={styles.sectionTitle}>{rel.title}</p>

      {entries.length === 0 && <p style={styles.emptyText}>Aucun événement enregistré.</p>}

      <div style={styles.relationList}>
        {entries.map((entry) => (
          <div key={entry.id} style={styles.logItem}>
            <div style={styles.logHeader}>
              <span style={styles.logDate}>{entry.date}</span>
              <span style={styles.relationBadge}>{entry.evenement}</span>
              <button style={styles.removeBtn} onClick={() => handleRemove(entry.id)} title="Retirer">
                <Trash2 size={13} color={COLORS.pink} />
              </button>
            </div>
            <p style={styles.logDetail}>{entry.situation_avant} → {entry.situation_apres}</p>
          </div>
        ))}
      </div>

      <div style={styles.logForm}>
        {rel.fields.map((f) => (
          <input
            key={f.key}
            type={f.type === 'date' ? 'date' : 'text'}
            placeholder={f.label}
            style={styles.logInput}
            value={draft[f.key]}
            onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
          />
        ))}
        <button style={styles.addBtn} onClick={handleAdd} disabled={!canAdd} title="Ajouter un événement">
          <Plus size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}

function ReadonlyRelation({ rel, row, tables, styles }) {
  let items = [];
  if (rel.resolve) {
    // Relation calculée sur plusieurs niveaux (ex : agents d'un grade, retrouvés
    // via la chaîne échelon → classe → grade), plutôt qu'une simple clé étrangère.
    items = rel.resolve(tables, row);
  } else if (rel.table) {
    items = tables[rel.table].rows
      .filter((r) => r[rel.fkField] === row.id)
      .map((r) => ({ label: rel.getLabel(r) }));
  } else if (rel.junctionTable) {
    items = tables[rel.junctionTable].rows
      .filter((r) => r[rel.ownerField] === row.id)
      .map((jr) => {
        const otherRow = tables[rel.otherTable].rows.find((r) => r.id === jr[rel.otherField]);
        return { label: otherRow ? rel.getLabel(otherRow) : '—', extra: rel.getExtra ? rel.getExtra(jr) : null };
      });
  }

  return (
    <div style={styles.section}>
      <p style={styles.sectionTitle}>{rel.title}</p>
      {items.length === 0 ? (
        <p style={styles.emptyText}>Aucune donnée.</p>
      ) : (
        <div style={styles.relationList}>
          {items.map((item, i) => (
            <div key={i} style={styles.relationItem}>
              <span style={styles.relationLabel}>{item.label}</span>
              {item.extra && <span style={styles.relationBadge}>{item.extra}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const getStyles = (darkMode) => ({
  identity: { marginBottom: '18px' },
  identityTitle: { margin: 0, fontSize: '17px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0f172a' },
  identitySubtitle: { margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' },

  section: { marginTop: '18px', paddingTop: '18px', borderTop: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0' },
  sectionTitle: { margin: '0 0 10px 0', fontSize: '13px', fontWeight: '700', color: darkMode ? '#e2e8f0' : '#334155' },
  emptyText: { margin: 0, fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' },

  relationList: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' },
  relationItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '10px', backgroundColor: darkMode ? '#18122B' : '#f8fafc', border: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0' },
  relationLabel: { flex: 1, fontSize: '13px', color: darkMode ? '#e2e8f0' : '#334155' },
  relationBadge: { fontSize: '11px', fontWeight: '600', color: COLORS.violet, backgroundColor: darkMode ? 'rgba(124,92,250,0.15)' : 'rgba(124,92,250,0.1)', padding: '2px 8px', borderRadius: '999px' },
  removeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' },

  logItem: { padding: '8px 12px', borderRadius: '10px', backgroundColor: darkMode ? '#18122B' : '#f8fafc', border: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0' },
  logHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
  logDate: { fontSize: '11.5px', fontWeight: '700', color: '#94a3b8', minWidth: '78px' },
  logDetail: { margin: '6px 0 0 0', fontSize: '12.5px', color: darkMode ? '#e2e8f0' : '#334155' },
  logForm: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  logInput: { flex: '1 1 130px', padding: '9px 12px', borderRadius: '10px', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', backgroundColor: darkMode ? '#18122B' : '#ffffff', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '12.5px', outline: 'none' },

  addRow: { display: 'flex', gap: '8px' },
  addSelect: { flex: 1, padding: '9px 12px', borderRadius: '10px', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', backgroundColor: darkMode ? '#18122B' : '#ffffff', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '13px', outline: 'none' },
  addNumber: { width: '64px', padding: '9px 10px', borderRadius: '10px', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', backgroundColor: darkMode ? '#18122B' : '#ffffff', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '13px', outline: 'none' },
  addBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: accentGradient, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});