import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, Trash2, Edit, Search, Sun, Moon, ArrowLeft, Columns, Check, X, Eye } from 'lucide-react';
import { COLORS, accentGradient } from '../theme';
import { INITIAL_TABLES, SCHEMA, HIDDEN_TABLES, DETAIL_CONFIG } from '../crudSchema';
import Modal from './crud/Modal';
import RecordForm from './crud/RecordForm';
import DetailPanel from './crud/DetailPanel';

export default function CrudModule({ darkMode, setDarkMode, onBackToChat }) {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [activeKey, setActiveKey] = useState('employe');
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
  const activeTable = tables[activeKey];
  const visibleColumns = activeTable.columns.filter((c) => c !== 'id');
  const hasDetail = Boolean(DETAIL_CONFIG[activeKey]);

  const switchTable = (key) => {
    setActiveKey(key);
    setSearchTerm('');
    setView('list');
    setShowAddColumn(false);
  };

  // ---- Recherche manuelle (sur les libellés affichés, pas les IDs bruts) ----
  const filteredRows = activeTable.rows.filter((row) =>
    visibleColumns.some((col) => String(resolveLabel(tables, activeKey, col, row[col]) ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const updateTableByKey = (key, updater) => {
    setTables((prev) => ({ ...prev, [key]: updater(prev[key]) }));
  };
  const updateTable = (updater) => updateTableByKey(activeKey, updater);

  // ---- Ajout manuel (page dédiée) ----
  const openAddPage = () => {
    const blank = {};
    visibleColumns.forEach((c) => (blank[c] = ''));
    setAddDraft(blank);
    setView('add');
  };
  const submitAdd = () => {
    const nextId = activeTable.rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    updateTable((t) => ({ ...t, rows: [...t.rows, { id: nextId, ...addDraft }] }));
    setView('list');
  };

  // ---- Modification manuelle (fenêtre) ----
  const saveEdit = () => {
    updateTable((t) => ({ ...t, rows: t.rows.map((r) => (r.id === editingRow.id ? editingRow : r)) }));
    setEditingRow(null);
  };

  // ---- Suppression manuelle (fenêtre de confirmation) ----
  const confirmDelete = () => {
    updateTable((t) => ({ ...t, rows: t.rows.filter((r) => r.id !== deletingRow.id) }));
    setDeletingRow(null);
  };

  // ---- Ajout de colonne manuel (formulaire) ----
  const submitAddColumn = () => {
    const key = newColumn.trim();
    if (!key || activeTable.columns.includes(key)) return;
    updateTable((t) => ({
      ...t,
      columns: [...t.columns, key],
      rows: t.rows.map((r) => ({ ...r, [key]: '' })),
    }));
    setNewColumn('');
    setShowAddColumn(false);
  };

  // ---- Import Excel (ajoute lignes + fusionne les nouvelles colonnes) ----
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

  return (
    <div style={styles.page}>
      <header style={styles.topbar}>
        <div style={styles.topbarLeft}>
          <button style={styles.backBtn} onClick={onBackToChat} title="Retour à l'assistant">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={styles.pageTitle}>Assistant RH</h1>
            <p style={styles.pageSubtitle}>Données</p>
          </div>
        </div>

        <nav style={styles.tableNav}>
          {Object.entries(tables)
            .filter(([key]) => !HIDDEN_TABLES.includes(key))
            .map(([key, t]) => (
              <button
                key={key}
                onClick={() => switchTable(key)}
                style={{ ...styles.tableTab, ...(key === activeKey ? styles.tableTabActive : {}) }}
              >
                {t.label}
              </button>
            ))}
        </nav>

        <button style={styles.themeToggle} onClick={() => setDarkMode(!darkMode)} title="Changer de thème">
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      {view === 'add' ? (
        <main style={styles.main}>
          <button style={styles.backToListBtn} onClick={() => setView('list')}>
            <ArrowLeft size={15} />
            <span>Retour à la liste</span>
          </button>

          <div style={styles.addPageCard}>
            <p style={styles.addPageTitle}>Nouvelle ligne — {activeTable.label}</p>
            <RecordForm
              tableKey={activeKey}
              columns={visibleColumns}
              tables={tables}
              value={addDraft}
              onChange={(col, val) => setAddDraft({ ...addDraft, [col]: val })}
              darkMode={darkMode}
            />
            <div style={styles.addPageActions}>
              <button style={styles.primaryBtn} onClick={submitAdd}>Enregistrer</button>
              <button style={styles.ghostBtn} onClick={() => setView('list')}>Annuler</button>
            </div>
          </div>
        </main>
      ) : (
        <main style={styles.main}>
          <div style={styles.toolbar}>
            <div style={styles.searchWrapper}>
              <Search size={16} color={darkMode ? '#94a3b8' : '#64748b'} />
              <input
                style={styles.searchInput}
                placeholder={`Rechercher dans ${activeTable.label}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={styles.toolbarActions}>
              <label style={styles.ghostBtn}>
                <Upload size={15} />
                <span>Importer Excel</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  style={{ display: 'none' }}
                  onChange={handleImport}
                />
              </label>
              <button style={styles.ghostBtn} onClick={() => setShowAddColumn(true)}>
                <Columns size={15} />
                <span>Ajouter une colonne</span>
              </button>
              <button style={styles.primaryBtn} onClick={openAddPage}>
                <Plus size={15} />
                <span>Ajouter manuellement</span>
              </button>
            </div>
          </div>

          {showAddColumn && (
            <div style={styles.inlineForm}>
              <input
                style={styles.formInput}
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
                  {visibleColumns.map((col) => (
                    <th key={col} style={styles.th}>{col}</th>
                  ))}
                  <th style={styles.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <tr key={row.id} style={styles.tr}>
                      {visibleColumns.map((col) => (
                        <td key={col} style={styles.td}>{resolveLabel(tables, activeKey, col, row[col])}</td>
                      ))}
                      <td style={styles.tdRight}>
                        {hasDetail && (
                          <button style={styles.iconBtn} onClick={() => setDetailRow(row)} title="Détails">
                            <Eye size={15} color={COLORS.violet} />
                          </button>
                        )}
                        <button style={styles.iconBtn} onClick={() => setEditingRow({ ...row })} title="Modifier">
                          <Edit size={15} color="#5C7CFA" />
                        </button>
                        <button style={styles.iconBtn} onClick={() => setDeletingRow(row)} title="Supprimer">
                          <Trash2 size={15} color="#e85d9a" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={visibleColumns.length + 1} style={styles.emptyRow}>
                      Aucune donnée trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {editingRow && (
        <Modal darkMode={darkMode} title={`Modifier — ${activeTable.label}`} onClose={() => setEditingRow(null)}>
          <RecordForm
            tableKey={activeKey}
            columns={visibleColumns}
            tables={tables}
            value={editingRow}
            onChange={(col, val) => setEditingRow({ ...editingRow, [col]: val })}
            darkMode={darkMode}
          />
          <div style={styles.modalActions}>
            <button style={styles.primaryBtn} onClick={saveEdit}>Enregistrer</button>
            <button style={styles.ghostBtn} onClick={() => setEditingRow(null)}>Annuler</button>
          </div>
        </Modal>
      )}

      {deletingRow && (
        <Modal darkMode={darkMode} title="Confirmer la suppression" onClose={() => setDeletingRow(null)} maxWidth="380px">
          <p style={styles.confirmText}>
            Voulez-vous vraiment supprimer cette ligne de « {activeTable.label} » ? Cette action est irréversible.
          </p>
          <div style={styles.modalActions}>
            <button style={styles.dangerBtn} onClick={confirmDelete}>Supprimer</button>
            <button style={styles.ghostBtn} onClick={() => setDeletingRow(null)}>Annuler</button>
          </div>
        </Modal>
      )}

      {detailRow && hasDetail && (
        <Modal darkMode={darkMode} title="Détails" onClose={() => setDetailRow(null)} maxWidth="520px">
          <DetailPanel tableKey={activeKey} row={detailRow} tables={tables} updateJunction={updateTableByKey} darkMode={darkMode} />
        </Modal>
      )}
    </div>
  );
}

// Remplace un identifiant de clé étrangère par le nom lisible correspondant.
function resolveLabel(tables, tableKey, column, value) {
  const fk = SCHEMA[tableKey]?.fks?.[column];
  if (!fk) return value;
  const refRow = (tables[fk.table]?.rows || []).find((r) => r.id === value);
  return refRow ? fk.getLabel(refRow) : '—';
}

const getStyles = (darkMode) => ({
  page: { flex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: darkMode ? '#18122B' : '#ffffff', color: darkMode ? '#ffffff' : '#0f172a', transition: 'all 0.3s' },

  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0', backgroundColor: darkMode ? '#211935' : '#f8fafc', gap: '16px' },
  topbarLeft: { display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 },
  backBtn: { width: '34px', height: '34px', borderRadius: '10px', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', background: 'transparent', color: darkMode ? '#e2e8f0' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  pageTitle: { margin: 0, fontSize: '19px', fontWeight: '800', whiteSpace: 'nowrap', color: darkMode ? '#ffffff' : '#0f172a' },
  pageSubtitle: { margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: '500' },

  tableNav: { display: 'flex', gap: '6px', overflowX: 'auto', flex: 1, justifyContent: 'center' },
  tableTab: { padding: '8px 16px', borderRadius: '999px', border: 'none', background: 'transparent', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  tableTabActive: { background: accentGradient, color: '#ffffff' },

  themeToggle: { width: '34px', height: '34px', borderRadius: '10px', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', background: 'transparent', color: darkMode ? '#facc15' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },

  main: { flex: 1, overflowY: 'auto', padding: '24px 32px' },

  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: darkMode ? '#211935' : '#f8fafc', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '16px', minWidth: '260px' },
  searchInput: { flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '14px' },

  toolbarActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  ghostBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: darkMode ? '#211935' : '#f1f5f9', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', borderRadius: '14px', cursor: 'pointer', fontSize: '13px', color: darkMode ? '#ffffff' : '#0f172a', fontWeight: '500' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: accentGradient, border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '13px', color: '#ffffff', fontWeight: '600' },
  dangerBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#ef4444', border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '13px', color: '#ffffff', fontWeight: '600' },

  inlineForm: { display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' },
  confirmBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  backToListBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: COLORS.violet, fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: 0, marginBottom: '18px' },
  addPageCard: { backgroundColor: darkMode ? '#211935' : '#f8fafc', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', borderRadius: '18px', padding: '26px', maxWidth: '480px' },
  addPageTitle: { margin: '0 0 18px 0', fontSize: '15px', fontWeight: '700' },
  addPageActions: { display: 'flex', gap: '10px', marginTop: '22px' },

  modalActions: { display: 'flex', gap: '10px', marginTop: '20px' },
  confirmText: { fontSize: '13.5px', color: darkMode ? '#e2e8f0' : '#334155', lineHeight: '1.6', margin: 0 },

  tableCard: { backgroundColor: darkMode ? '#211935' : '#ffffff', border: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  th: { padding: '14px 20px', color: '#94a3b8', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', borderBottom: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0', backgroundColor: darkMode ? '#1f1832' : '#f8fafc', whiteSpace: 'nowrap' },
  thRight: { padding: '14px 20px', color: '#94a3b8', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', textAlign: 'right', borderBottom: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0', backgroundColor: darkMode ? '#1f1832' : '#f8fafc' },
  tr: { borderBottom: darkMode ? '1px solid #2d234a' : '1px solid #f1f5f9' },
  td: { padding: '14px 20px', color: darkMode ? '#e2e8f0' : '#334155' },
  tdRight: { padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' },
  iconBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', marginLeft: '4px' },
  emptyRow: { padding: '24px', textAlign: 'center', color: '#94a3b8' },
});