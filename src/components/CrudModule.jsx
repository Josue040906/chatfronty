import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, Trash2, Edit, Search, Sun, Moon, ArrowLeft, Columns, Check, X } from 'lucide-react';
import { COLORS, accentGradient } from '../theme';

// Données de départ : chaque clé correspond exactement à une table de la base
// PostgreSQL "assistant_rh" (voir documentation du projet), avec ses colonnes réelles.
// Les tables de jonction (employe_competence, poste_competence, domaine_competence_relation)
// n'ont pas de colonne "id" dans le schéma réel : un identifiant technique interne
// est ajouté uniquement pour la gestion des lignes côté interface (édition/suppression),
// il n'est pas affiché.
const INITIAL_TABLES = {
  service: {
    label: 'Services',
    columns: ['id', 'nom', 'description'],
    rows: [
      { id: 1, nom: 'Direction des Ressources Humaines', description: 'Gestion du personnel et des compétences' },
      { id: 2, nom: 'Direction Informatique', description: "Systèmes d'information et développement" },
      { id: 3, nom: 'Direction Financière', description: 'Gestion budgétaire et comptable' },
    ],
  },
  poste: {
    label: 'Postes',
    columns: ['id', 'intitule', 'description', 'service_id'],
    rows: [
      { id: 1, intitule: 'Développeur logiciel', description: "Conception et développement d'applications", service_id: 2 },
      { id: 2, intitule: 'Administrateur systèmes', description: 'Administration des infrastructures IT', service_id: 2 },
      { id: 3, intitule: 'Analyste financier', description: 'Analyse des données financières', service_id: 3 },
      { id: 4, intitule: 'Gestionnaire RH', description: 'Gestion administrative du personnel', service_id: 1 },
      { id: 5, intitule: 'Chef de projet informatique', description: 'Pilotage de projets IT', service_id: 2 },
      { id: 6, intitule: 'Gestionnaire budgetaire', description: "Suivi de l'exécution budgétaire", service_id: 3 },
      { id: 7, intitule: 'Controleur financier', description: 'Contrôle des opérations financières', service_id: 3 },
      { id: 8, intitule: 'Comptable public', description: 'Tenue de la comptabilité publique', service_id: 3 },
      { id: 9, intitule: 'Auditeur financier', description: 'Audit des comptes et des procédures', service_id: 3 },
    ],
  },
  employe: {
    label: 'Employés',
    columns: ['id', 'matricule', 'nom', 'prenom', 'date_naissance', 'date_embauche', 'poste_id', 'service_id'],
    rows: [
      { id: 1, matricule: 'EMP001', nom: 'RAKOTO', prenom: 'Jean', date_naissance: '1990-04-12', date_embauche: '2018-06-01', poste_id: 1, service_id: 2 },
      { id: 2, matricule: 'EMP002', nom: 'RABE', prenom: 'Paul', date_naissance: '1985-11-23', date_embauche: '2015-02-15', poste_id: 5, service_id: 2 },
      { id: 3, matricule: 'EMP003', nom: 'RASOLO', prenom: 'Marie', date_naissance: '1992-07-08', date_embauche: '2019-09-01', poste_id: 1, service_id: 2 },
      { id: 4, matricule: 'EMP004', nom: 'ANDRIANA', prenom: 'Luc', date_naissance: '1988-01-30', date_embauche: '2016-03-10', poste_id: 2, service_id: 2 },
      { id: 5, matricule: 'EMP005', nom: 'RAZAFI', prenom: 'Sarah', date_naissance: '1991-05-19', date_embauche: '2020-01-20', poste_id: 3, service_id: 3 },
      { id: 6, matricule: 'EMP006', nom: 'RANDRIA', prenom: 'Hery', date_naissance: '1987-09-02', date_embauche: '2014-11-05', poste_id: 4, service_id: 1 },
    ],
  },
  competence: {
    label: 'Compétences',
    columns: ['id', 'nom', 'description'],
    rows: [
      { id: 1, nom: 'Java', description: 'Langage de programmation orienté objet' },
      { id: 2, nom: 'SQL', description: 'Requêtage et gestion de bases de données' },
      { id: 3, nom: 'Gestion de projet', description: 'Planification et pilotage de projets' },
      { id: 4, nom: 'Administration systèmes', description: "Gestion des infrastructures et serveurs" },
      { id: 5, nom: 'Développement web', description: "Conception d'applications web" },
      { id: 6, nom: 'Communication', description: "Capacité à transmettre l'information" },
      { id: 7, nom: 'Analyse financière', description: 'Analyse des données et indicateurs financiers' },
      { id: 8, nom: 'Gestion des ressources humaines', description: 'Gestion administrative du personnel' },
      { id: 9, nom: 'Gestion budgetaire', description: "Élaboration et suivi du budget" },
      { id: 10, nom: 'Execution budgetaire', description: "Mise en œuvre des dépenses budgétées" },
      { id: 11, nom: 'Comptabilite publique', description: 'Tenue des comptes publics' },
      { id: 12, nom: 'Controle financier', description: 'Vérification de la régularité des opérations' },
      { id: 13, nom: 'Preparation budgetaire', description: "Élaboration des projets de budget" },
      { id: 14, nom: 'Gestion des depenses publiques', description: 'Suivi des dépenses de l\'État' },
      { id: 15, nom: 'Gestion des recettes publiques', description: "Suivi des recettes de l'État" },
      { id: 16, nom: 'Audit financier', description: 'Examen des comptes et procédures' },
      { id: 17, nom: 'Marches publics', description: 'Gestion des procédures de marchés publics' },
    ],
  },
  employe_competence: {
    label: 'Compétences employés',
    columns: ['employe_id', 'competence_id', 'niveau'],
    rows: [
      { id: 1, employe_id: 1, competence_id: 1, niveau: 4 },
      { id: 2, employe_id: 1, competence_id: 2, niveau: 3 },
      { id: 3, employe_id: 3, competence_id: 1, niveau: 3 },
      { id: 4, employe_id: 3, competence_id: 5, niveau: 4 },
      { id: 5, employe_id: 4, competence_id: 4, niveau: 5 },
      { id: 6, employe_id: 5, competence_id: 7, niveau: 4 },
      { id: 7, employe_id: 5, competence_id: 9, niveau: 3 },
      { id: 8, employe_id: 5, competence_id: 12, niveau: 3 },
      { id: 9, employe_id: 6, competence_id: 8, niveau: 4 },
      { id: 10, employe_id: 2, competence_id: 3, niveau: 4 },
    ],
  },
  domaine_competence: {
    label: 'Domaines',
    columns: ['id', 'nom', 'description'],
    rows: [
      { id: 1, nom: 'Développement', description: 'Compétences liées au développement logiciel' },
      { id: 2, nom: 'Finances publiques', description: 'Compétences liées à la gestion budgétaire et financière' },
      { id: 3, nom: 'Ressources humaines', description: 'Compétences RH et gestion du personnel' },
    ],
  },
  domaine_competence_relation: {
    label: 'Domaines ↔ Compétences',
    columns: ['domaine_id', 'competence_id'],
    rows: [
      { id: 1, domaine_id: 1, competence_id: 1 },
      { id: 2, domaine_id: 1, competence_id: 5 },
      { id: 3, domaine_id: 2, competence_id: 9 },
      { id: 4, domaine_id: 2, competence_id: 12 },
      { id: 5, domaine_id: 3, competence_id: 8 },
    ],
  },
  poste_competence: {
    label: 'Compétences requises',
    columns: ['poste_id', 'competence_id', 'niveau_requis'],
    rows: [
      { id: 1, poste_id: 6, competence_id: 9, niveau_requis: 4 },
      { id: 2, poste_id: 6, competence_id: 10, niveau_requis: 3 },
      { id: 3, poste_id: 6, competence_id: 14, niveau_requis: 3 },
      { id: 4, poste_id: 7, competence_id: 12, niveau_requis: 4 },
      { id: 5, poste_id: 7, competence_id: 16, niveau_requis: 3 },
      { id: 6, poste_id: 1, competence_id: 1, niveau_requis: 4 },
      { id: 7, poste_id: 1, competence_id: 5, niveau_requis: 3 },
    ],
  },
};

export default function CrudModule({ darkMode, setDarkMode, onBackToChat }) {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [activeKey, setActiveKey] = useState('employe');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRow, setNewRow] = useState({});
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumn, setNewColumn] = useState('');
  const fileInputRef = useRef(null);

  const styles = getStyles(darkMode);
  const activeTable = tables[activeKey];

  const switchTable = (key) => {
    setActiveKey(key);
    setSearchTerm('');
    setEditingId(null);
    setShowAddRow(false);
    setShowAddColumn(false);
  };

  // ---- Recherche manuelle ----
  const filteredRows = activeTable.rows.filter((row) =>
    activeTable.columns.some((col) => String(row[col] ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ---- Modification manuelle ----
  const startEdit = (row) => { setEditingId(row.id); setEditDraft(row); };
  const saveEdit = () => {
    updateTable((t) => ({ ...t, rows: t.rows.map((r) => (r.id === editDraft.id ? editDraft : r)) }));
    setEditingId(null);
  };

  // ---- Suppression manuelle ----
  const deleteRow = (id) => {
    updateTable((t) => ({ ...t, rows: t.rows.filter((r) => r.id !== id) }));
  };

  // ---- Ajout de ligne manuel (formulaire) ----
  const openAddRow = () => {
    const blank = {};
    activeTable.columns.forEach((c) => (blank[c] = ''));
    setNewRow(blank);
    setShowAddRow(true);
  };
  const submitAddRow = () => {
    const nextId = activeTable.rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    updateTable((t) => ({ ...t, rows: [...t.rows, { id: nextId, ...newRow }] }));
    setShowAddRow(false);
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

  const updateTable = (updater) => {
    setTables((prev) => ({ ...prev, [activeKey]: updater(prev[activeKey]) }));
  };

  return (
    <div style={styles.page}>
      <header style={styles.topbar}>
        <div style={styles.topbarLeft}>
          <button style={styles.backBtn} onClick={onBackToChat} title="Retour à l'assistant">
            <ArrowLeft size={16} />
          </button>
          <span style={styles.brand}>
            Assistant <span style={styles.ia}>RH</span> <span style={styles.brandSub}>— Données</span>
          </span>
        </div>

        <nav style={styles.tableNav}>
          {Object.entries(tables).map(([key, t]) => (
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
            <button style={styles.primaryBtn} onClick={openAddRow}>
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

        {showAddRow && (
          <div style={styles.addRowCard}>
            <p style={styles.addRowTitle}>Nouvelle ligne — {activeTable.label}</p>
            <div style={styles.addRowGrid}>
              {activeTable.columns.map((col) => (
                <div key={col} style={styles.formField}>
                  <label style={styles.formLabel}>{col}</label>
                  <input
                    style={styles.formInput}
                    value={newRow[col] || ''}
                    onChange={(e) => setNewRow({ ...newRow, [col]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div style={styles.addRowActions}>
              <button style={styles.primaryBtn} onClick={submitAddRow}>Enregistrer</button>
              <button style={styles.ghostBtn} onClick={() => setShowAddRow(false)}>Annuler</button>
            </div>
          </div>
        )}

        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                {activeTable.columns.map((col) => (
                  <th key={col} style={styles.th}>{col}</th>
                ))}
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.id} style={styles.tr}>
                    {activeTable.columns.map((col) => (
                      <td key={col} style={styles.td}>
                        {editingId === row.id ? (
                          <input
                            style={styles.editInput}
                            value={editDraft[col] ?? ''}
                            onChange={(e) => setEditDraft({ ...editDraft, [col]: e.target.value })}
                          />
                        ) : (
                          row[col]
                        )}
                      </td>
                    ))}
                    <td style={styles.tdRight}>
                      {editingId === row.id ? (
                        <button style={styles.saveBtn} onClick={saveEdit}>Enregistrer</button>
                      ) : (
                        <button style={styles.iconBtn} onClick={() => startEdit(row)} title="Modifier">
                          <Edit size={15} color="#5C7CFA" />
                        </button>
                      )}
                      <button style={styles.iconBtn} onClick={() => deleteRow(row.id)} title="Supprimer">
                        <Trash2 size={15} color="#e85d9a" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTable.columns.length + 1} style={styles.emptyRow}>
                    Aucune donnée trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

const getStyles = (darkMode) => ({
  page: { flex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: darkMode ? '#18122B' : '#ffffff', color: darkMode ? '#ffffff' : '#0f172a', transition: 'all 0.3s' },

  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0', backgroundColor: darkMode ? '#211935' : '#f8fafc', gap: '16px' },
  topbarLeft: { display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 },
  backBtn: { width: '34px', height: '34px', borderRadius: '10px', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', background: 'transparent', color: darkMode ? '#e2e8f0' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  brand: { fontWeight: '700', fontSize: '15px', whiteSpace: 'nowrap' },
  ia: { fontWeight: '800', background: accentGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' },
  brandSub: { fontWeight: '500', fontSize: '12px', color: '#94a3b8', marginLeft: '4px' },

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

  inlineForm: { display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' },
  confirmBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  addRowCard: { backgroundColor: darkMode ? '#211935' : '#f8fafc', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', borderRadius: '16px', padding: '18px', marginBottom: '18px' },
  addRowTitle: { margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700' },
  addRowGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '14px' },
  formField: { display: 'flex', flexDirection: 'column', gap: '4px' },
  formLabel: { fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' },
  formInput: { padding: '9px 12px', borderRadius: '10px', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', backgroundColor: darkMode ? '#18122B' : '#ffffff', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '13px', outline: 'none' },
  addRowActions: { display: 'flex', gap: '10px' },

  tableCard: { backgroundColor: darkMode ? '#211935' : '#ffffff', border: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  th: { padding: '14px 20px', color: '#94a3b8', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', borderBottom: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0', backgroundColor: darkMode ? '#1f1832' : '#f8fafc', whiteSpace: 'nowrap' },
  thRight: { padding: '14px 20px', color: '#94a3b8', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', textAlign: 'right', borderBottom: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0', backgroundColor: darkMode ? '#1f1832' : '#f8fafc' },
  tr: { borderBottom: darkMode ? '1px solid #2d234a' : '1px solid #f1f5f9' },
  td: { padding: '14px 20px', color: darkMode ? '#e2e8f0' : '#334155' },
  tdRight: { padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' },
  editInput: { padding: '6px 10px', borderRadius: '8px', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', backgroundColor: darkMode ? '#18122B' : '#ffffff', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '13px', outline: 'none', width: '100%' },
  iconBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', marginLeft: '4px' },
  saveBtn: { background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  emptyRow: { padding: '24px', textAlign: 'center', color: '#94a3b8' },
});