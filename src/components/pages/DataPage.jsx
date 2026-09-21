import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, Trash2, Edit, Search, ArrowLeft, Columns, Check, X, Eye } from 'lucide-react';
import { COLORS, accentGradient } from '../../theme';
import { SCHEMA, DETAIL_CONFIG, LIST_COLUMNS } from '../../crudSchema';
import Modal from '../crud/Modal';
import RecordForm from '../crud/RecordForm';
import DetailPanel from '../crud/DetailPanel';

// Page générique de consultation et de gestion d'une table.
// La navigation entre rubriques est assurée par la barre du haut : cette page
// ne s'occupe que de la table qu'on lui passe via `tableKey`.
export default function DataPage({ tableKey, tables, setTables, focusRecordId, onFocusHandled, darkMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [addDraft, setAddDraft] = useState({});
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumn, setNewColumn] = useState('');
  const [editingRow, setEditingRow] = useState(null);
  const [deletingRow, setDeletingRow] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const fileInputRef = useRef(null);

  const styles = getStyles(darkMode);
  const table = tables[tableKey];
  const meta = SCHEMA[tableKey];
  const formColumns = table.columns.filter((c) => c !== 'id');
  const listColumns = LIST_COLUMNS[tableKey] || formColumns;
  const hasDetail = Boolean(DETAIL_CONFIG[tableKey]);

  // Réinitialise la vue quand on change de rubrique.
  useEffect(() => {
    setSearchTerm('');
    setView('list');
    setShowAddColumn(false);
    setEditingRow(null);
    setDeletingRow(null);
    setDetailRow(null);
  }, [tableKey]);

  // Ouverture directe d'une fiche demandée depuis le tableau de bord ou l'assistant.
  useEffect(() => {
    if (!focusRecordId) return;
    const row = table.rows.find((r) => r.id === focusRecordId);
    if (row && hasDetail) setDetailRow(row);
    onFocusHandled?.();
  }, [focusRecordId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateTableByKey = (key, updater) => {
    setTables((prev) => ({ ...prev, [key]: updater(prev[key]) }));
  };
  const updateTable = (updater) => updateTableByKey(tableKey, updater);

  const filteredRows = table.rows.filter((row) =>
    listColumns.some((col) =>
      String(resolveLabel(tables, tableKey, col, row[col]) ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const openAddPage = () => {
    const blank = {};
    formColumns.forEach((c) => (blank[c] = ''));
    setAddDraft(blank);
    setView('add');
  };

  const submitAdd = () => {
    const nextId = table.rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    updateTable((t) => ({ ...t, rows: [...t.rows, { id: nextId, ...addDraft }] }));
    setView('list');
  };

  const saveEdit = () => {
    updateTable((t) => ({ ...t, rows: t.rows.map((r) => (r.id === editingRow.id ? editingRow : r)) }));
    setEditingRow(null);
  };

  const confirmDelete = () => {
    updateTable((t) => ({ ...t, rows: t.rows.filter((r) => r.id !== deletingRow.id) }));
    setDeletingRow(null);
  };

  const submitAddColumn = () => {
    const key = newColumn.trim();
    if (!key || table.columns.includes(key)) return;
    updateTable((t) => ({
      ...t,
      columns: [...t.columns, key],
      rows: t.rows.map((r) => ({ ...r, [key]: '' })),
    }));
    setNewColumn('');
    setShowAddColumn(false);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!json.length) return;
      updateTable((t) => {
        const importedColumns = Object.keys(json[0]);
        const mergedColumns = [...t.columns, ...importedColumns.filter((c) => !t.columns.includes(c))];
        let nextId = t.rows.reduce((max, r) => Math.max(max, r.id), 0);
        const newRows = json.map((row) => {
          nextId += 1;
          const full = { id: nextId };
          mergedColumns.forEach((c) => (full[c] = row[c] ?? ''));
          return full;
        });
        return { ...t, columns: mergedColumns, rows: [...t.rows, ...newRows] };
      });
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // ---- Page d'ajout (page dédiée, formulaire vertical) ----
  if (view === 'add') {
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => setView('list')}>
          <ArrowLeft size={15} />
          <span>Retour à la liste</span>
        </button>
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Nouvel enregistrement — {meta.label}</h2>
          <RecordForm
            tableKey={tableKey}
            columns={formColumns}
            tables={tables}
            value={addDraft}
            onChange={(col, val) => setAddDraft((d) => ({ ...d, [col]: val }))}
            darkMode={darkMode}
          />
          <div style={styles.formActions}>
            <button style={styles.ghostBtn} onClick={() => setView('list')}>Annuler</button>
            <button style={styles.primaryBtn} onClick={submitAdd}>Enregistrer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>{meta.label}</h1>
          <p style={styles.subtitle}>{table.rows.length} enregistrement{table.rows.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <Search size={16} color="#94a3b8" />
          <input
            style={styles.searchInput}
            placeholder={`Rechercher dans ${meta.label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={styles.toolbarActions}>
          <label style={styles.ghostBtn}>
            <Upload size={15} />
            <span>Importer Excel</span>
            <input ref={fileInputRef} type="file" accept=".xlsx, .xls, .csv" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <button style={styles.ghostBtn} onClick={() => setShowAddColumn(true)}>
            <Columns size={15} />
            <span>Ajouter une colonne</span>
          </button>
          <button style={styles.primaryBtn} onClick={openAddPage}>
            <Plus size={15} />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {showAddColumn && (
        <div style={styles.inlineForm}>
          <input
            style={styles.inlineInput}
            placeholder="Nom de la nouvelle colonne"
            value={newColumn}
            onChange={(e) => setNewColumn(e.target.value)}
            autoFocus
          />
          <button style={styles.confirmBtn} onClick={submitAddColumn}><Check size={14} /></button>
          <button style={styles.cancelBtn} onClick={() => { setShowAddColumn(false); setNewColumn(''); }}><X size={14} /></button>
        </div>
      )}

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              {listColumns.map((col) => (
                <th key={col} style={styles.th}>{fieldLabel(col)}</th>
              ))}
              <th style={styles.thRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <tr key={row.id} style={styles.tr}>
                  {listColumns.map((col) => (
                    <td key={col} style={styles.td}>
                      {String(resolveLabel(tables, tableKey, col, row[col]) ?? '') || '—'}
                    </td>
                  ))}
                  <td style={styles.tdRight}>
                    {hasDetail && (
                      <button style={styles.iconBtn} onClick={() => setDetailRow(row)} title="Voir les détails">
                        <Eye size={15} color={COLORS.violet} />
                      </button>
                    )}
                    <button style={styles.iconBtn} onClick={() => setEditingRow(row)} title="Modifier">
                      <Edit size={15} color={COLORS.blue} />
                    </button>
                    <button style={styles.iconBtn} onClick={() => setDeletingRow(row)} title="Supprimer">
                      <Trash2 size={15} color="#ef4444" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={listColumns.length + 1} style={styles.emptyRow}>Aucune donnée trouvée.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingRow && (
        <Modal title={`Modifier — ${meta.label}`} onClose={() => setEditingRow(null)} darkMode={darkMode}>
          <RecordForm
            tableKey={tableKey}
            columns={formColumns}
            tables={tables}
            value={editingRow}
            onChange={(col, val) => setEditingRow((r) => ({ ...r, [col]: val }))}
            darkMode={darkMode}
          />
          <div style={styles.formActions}>
            <button style={styles.ghostBtn} onClick={() => setEditingRow(null)}>Annuler</button>
            <button style={styles.primaryBtn} onClick={saveEdit}>Enregistrer</button>
          </div>
        </Modal>
      )}

      {deletingRow && (
        <Modal title="Confirmer la suppression" onClose={() => setDeletingRow(null)} darkMode={darkMode}>
          <p style={styles.confirmText}>
            Voulez-vous vraiment supprimer cet enregistrement ? Cette action est irréversible.
          </p>
          <div style={styles.formActions}>
            <button style={styles.ghostBtn} onClick={() => setDeletingRow(null)}>Annuler</button>
            <button style={styles.dangerBtn} onClick={confirmDelete}>Supprimer</button>
          </div>
        </Modal>
      )}

      {detailRow && (
        <Modal title="Fiche détaillée" onClose={() => setDetailRow(null)} darkMode={darkMode} maxWidth="640px">
          <DetailPanel tableKey={tableKey} row={detailRow} tables={tables} updateJunction={updateTableByKey} darkMode={darkMode} />
        </Modal>
      )}
    </div>
  );
}

function resolveLabel(tables, tableKey, column, value) {
  const fk = SCHEMA[tableKey]?.fks?.[column];
  if (!fk) return value;
  const refRow = (tables[fk.table]?.rows || []).find((r) => r.id === value);
  return refRow ? fk.getLabel(refRow) : '—';
}

function fieldLabel(col) {
  const clean = col.endsWith('_id') ? col.slice(0, -3) : col;
  return clean.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

const getStyles = (darkMode) => ({
  page: { padding: '24px 28px', overflowY: 'auto', flex: 1 },
  headerRow: { marginBottom: '18px' },
  title: { margin: 0, fontSize: '22px', fontWeight: '800', color: darkMode ? '#ffffff' : '#0f172a' },
  subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' },

  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: darkMode ? '#e2e8f0' : '#334155', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '16px', padding: 0 },
  formCard: { maxWidth: '540px', backgroundColor: darkMode ? COLORS.darkSurface : '#ffffff', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' },
  formTitle: { margin: '0 0 18px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0f172a' },
  formActions: { display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' },

  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: darkMode ? COLORS.darkSurface : '#ffffff', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '12px', minWidth: '260px', flex: '0 1 320px' },
  searchInput: { flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '14px' },
  toolbarActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  ghostBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: darkMode ? COLORS.darkSurface : '#f1f5f9', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', color: darkMode ? '#ffffff' : '#0f172a', fontWeight: '600' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: accentGradient, border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', color: '#ffffff', fontWeight: '700' },
  dangerBtn: { padding: '10px 18px', background: '#ef4444', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', color: '#ffffff', fontWeight: '700' },

  inlineForm: { display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' },
  inlineInput: { padding: '10px 14px', borderRadius: '12px', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #cbd5e1', backgroundColor: darkMode ? COLORS.darkBg : '#ffffff', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '13px', outline: 'none', minWidth: '260px' },
  confirmBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: COLORS.green, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  tableCard: { backgroundColor: darkMode ? COLORS.darkSurface : '#ffffff', border: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', borderRadius: '16px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' },
  th: { padding: '13px 18px', color: '#94a3b8', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0', whiteSpace: 'nowrap' },
  thRight: { padding: '13px 18px', color: '#94a3b8', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px', textAlign: 'right', borderBottom: darkMode ? `1px solid ${COLORS.darkBorder}` : '1px solid #e2e8f0' },
  tr: { borderBottom: darkMode ? '1px solid #2d234a' : '1px solid #f1f5f9' },
  td: { padding: '13px 18px', color: darkMode ? '#e2e8f0' : '#334155', whiteSpace: 'nowrap' },
  tdRight: { padding: '13px 18px', textAlign: 'right', whiteSpace: 'nowrap' },
  iconBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', marginLeft: '2px' },
  emptyRow: { padding: '28px', textAlign: 'center', color: '#94a3b8' },
  confirmText: { fontSize: '14px', color: darkMode ? '#e2e8f0' : '#334155', lineHeight: 1.6, margin: 0 },
});