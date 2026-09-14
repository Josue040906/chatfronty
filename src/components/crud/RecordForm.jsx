import React from 'react';
import { SCHEMA } from '../../crudSchema';

// Formulaire vertical (haut → bas) partagé par la page d'ajout et la fenêtre
// de modification. Toute colonne qui est une clé étrangère (voir crudSchema)
// devient un menu déroulant listant les entités par leur nom — jamais un
// champ où l'utilisateur devrait saisir ou retenir un identifiant.
export default function RecordForm({ tableKey, columns, tables, value, onChange, darkMode }) {
  const styles = getStyles(darkMode);
  const fks = SCHEMA[tableKey]?.fks || {};

  return (
    <div style={styles.form}>
      {columns.map((col) => {
        const fk = fks[col];
        return (
          <div key={col} style={styles.field}>
            <label style={styles.label}>{fieldLabel(col)}</label>
            {fk ? (
              <select
                style={styles.input}
                value={value[col] ?? ''}
                onChange={(e) => onChange(col, e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">— Sélectionner —</option>
                {(tables[fk.table]?.rows || []).map((row) => (
                  <option key={row.id} value={row.id}>{fk.getLabel(row)}</option>
                ))}
              </select>
            ) : (
              <input
                style={styles.input}
                value={value[col] ?? ''}
                onChange={(e) => onChange(col, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Transforme "date_naissance" -> "Date naissance", "service_id" -> "Service", etc.
function fieldLabel(col) {
  const clean = col.endsWith('_id') ? col.slice(0, -3) : col;
  return clean.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

const getStyles = (darkMode) => ({
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '600', color: darkMode ? '#94a3b8' : '#64748b' },
  input: { padding: '11px 14px', borderRadius: '12px', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', backgroundColor: darkMode ? '#18122B' : '#ffffff', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
});