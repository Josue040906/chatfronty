import { useState } from 'react';
import TopNav from './components/layout/TopNav';
import Dashboard from './components/pages/Dashboard';
import DataPage from './components/pages/DataPage';
import AssistantPanel from './components/assistant/AssistantPanel';
import { INITIAL_TABLES, CURRENT_USER_ID } from './crudSchema';
import { COLORS } from './theme';

export default function App() {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [section, setSection] = useState('dashboard');
  const [focusRecord, setFocusRecord] = useState(null); // { table, id }
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const currentUser = tables.employe.rows.find((a) => a.id === CURRENT_USER_ID) || tables.employe.rows[0];
  const notifications = tables.notification.rows;

  const markAllRead = () => {
    setTables((prev) => ({
      ...prev,
      notification: { ...prev.notification, rows: prev.notification.rows.map((n) => ({ ...n, lue: true })) },
    }));
  };

  // Ouvre directement la fiche d'un enregistrement depuis le tableau de bord
  // ou depuis l'assistant.
  const openRecord = (tableKey, id) => {
    setSection(tableKey);
    setFocusRecord({ table: tableKey, id });
  };

  const navigate = (key) => {
    setSection(key);
    setFocusRecord(null);
  };

  const shell = {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: darkMode ? COLORS.darkBg : '#f8fafc',
    color: darkMode ? '#ffffff' : '#0f172a',
    transition: 'background-color 0.3s',
  };

  return (
    <div style={shell}>
      <TopNav
        activeSection={section}
        onNavigate={navigate}
        notifications={notifications}
        onMarkAllRead={markAllRead}
        currentUser={currentUser}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {section === 'dashboard' ? (
          <Dashboard
            tables={tables}
            onNavigate={navigate}
            onOpenRecord={openRecord}
            darkMode={darkMode}
          />
        ) : (
          <DataPage
            key={section}
            tableKey={section}
            tables={tables}
            setTables={setTables}
            focusRecordId={focusRecord?.table === section ? focusRecord.id : null}
            onFocusHandled={() => setFocusRecord(null)}
            darkMode={darkMode}
          />
        )}
      </main>

      <AssistantPanel
        open={assistantOpen}
        onOpen={() => setAssistantOpen(true)}
        onClose={() => setAssistantOpen(false)}
        tables={tables}
        onNavigate={navigate}
        onOpenRecord={openRecord}
        darkMode={darkMode}
      />
    </div>
  );
}