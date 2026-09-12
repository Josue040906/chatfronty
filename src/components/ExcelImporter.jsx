import React, { useState } from 'react';
import { Upload, Plus, Trash2, Edit, Search, UserCheck } from 'lucide-react';

export default function ExcelImporter({ darkMode }) {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Jean Dupont', role: 'Développeur Fullstack', department: 'IT', status: 'Actif' },
    { id: 2, name: 'Marie Curie', role: 'Data Scientist', department: 'R&D', status: 'Actif' },
    { id: 3, name: 'Paul Martin', role: 'RH Manager', department: 'Ressources Humaines', status: 'En congé' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const styles = getStyles(darkMode);

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* Header Module */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Gestion du Personnel & Données RH</h2>
          <p style={styles.subtitle}>Gérez les données collaborateurs alimentant l'Assistant IA</p>
        </div>
        <div style={styles.actions}>
          <label style={styles.uploadBtn}>
            <Upload size={16} />
            <span>Importer Excel</span>
            <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} />
          </label>
          <button style={styles.addBtn}>
            <Plus size={16} />
            <span>Ajouter Collaborateur</span>
          </button>
        </div>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div style={styles.searchBarContainer}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Rechercher un employé, rôle ou département..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Tableau CRUD */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Employé</th>
              <th style={styles.th}>Poste</th>
              <th style={styles.th}>Département</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.thRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={styles.empInfo}>
                    <div style={styles.avatar}>{emp.name.split(' ').map(n => n[0]).join('')}</div>
                    <span style={styles.empName}>{emp.name}</span>
                  </div>
                </td>
                <td style={styles.td}>{emp.role}</td>
                <td style={styles.td}>{emp.department}</td>
                <td style={styles.td}>
                  <span style={emp.status === 'Actif' ? styles.badgeActive : styles.badgeLeave}>
                    {emp.status}
                  </span>
                </td>
                <td style={styles.tdRight}>
                  <button style={styles.iconBtn} title="Modifier">
                    <Edit size={16} color="#5C7CFA" />
                  </button>
                  <button style={styles.iconBtn} title="Supprimer">
                    <Trash2 size={16} color="#e85d9a" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const getStyles = (darkMode) => ({
  container: { flex: 1, height: '100vh', backgroundColor: darkMode ? '#18122B' : '#ffffff', padding: '32px', boxSizing: 'border-box', overflowY: 'auto', color: darkMode ? '#ffffff' : '#0f172a', transition: 'all 0.3s' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' },
  title: { margin: 0, fontSize: '22px', fontWeight: 'bold' },
  subtitle: { margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' },
  actions: { display: 'flex', gap: '12px' },
  uploadBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: darkMode ? '#211935' : '#f1f5f9', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', color: darkMode ? '#ffffff' : '#0f172a', fontWeight: '500' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'linear-gradient(135deg, #e85d9a, #5c7cfa)', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', color: '#ffffff', fontWeight: '600' },
  searchBarContainer: { marginBottom: '20px' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: darkMode ? '#211935' : '#f8fafc', border: darkMode ? '1px solid #2d234a' : '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '16px' },
  searchInput: { flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '14px' },
  tableCard: { backgroundColor: darkMode ? '#211935' : '#ffffff', border: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  thRow: { borderBottom: darkMode ? '1px solid #2d234a' : '1px solid #e2e8f0', backgroundColor: darkMode ? '#1f1832' : '#f8fafc' },
  th: { padding: '14px 20px', color: '#94a3b8', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' },
  thRight: { padding: '14px 20px', color: '#94a3b8', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' },
  tr: { borderBottom: darkMode ? '1px solid #2d234a' : '1px solid #f1f5f9' },
  td: { padding: '14px 20px', color: darkMode ? '#e2e8f0' : '#334155' },
  tdRight: { padding: '14px 20px', textAlign: 'right' },
  empInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px' },
  empName: { fontWeight: '500' },
  badgeActive: { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
  badgeLeave: { backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#facc15', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
  iconBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }
});