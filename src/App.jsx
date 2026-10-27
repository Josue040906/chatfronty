import { useEffect, useState } from 'react';
import TopNav from './components/layout/TopNav';
import Dashboard from './components/pages/Dashboard';
import DataPage from './components/pages/DataPage';
import AssistantPanel from './components/assistant/AssistantPanel';
import AuthPage from './components/auth/AuthPage';
import { INITIAL_TABLES, CURRENT_USER_ID } from './crudSchema';
import { COLORS } from './theme';

const SESSION_KEY = 'sygpers.session';
const API_URL = (import.meta.env.VITE_ASSISTANT_RH_API_URL || 'http://localhost:8080').replace(/\/$/, '');

function readSession() {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value);
    return session?.accessToken ? session : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [section, setSection] = useState('dashboard');
  const [focusRecord, setFocusRecord] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [session, setSession] = useState(() => readSession());

  useEffect(() => {
    if (!session?.accessToken) return undefined;
    const remaining = Number(session.expiresAt) - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) {
      handleLogout(false);
      return undefined;
    }
    const timer = window.setTimeout(() => handleLogout(false), remaining);
    return () => window.clearTimeout(timer);
  }, [session?.accessToken, session?.expiresAt]);

  const handleLogin = (data) => {
    const expiresIn = Number(data.expiresIn) > 0 ? Number(data.expiresIn) : 3600;
    const nextSession = {
      ...data,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const handleLogout = async (notifyServer = true) => {
    const current = session || readSession();
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setAssistantOpen(false);
    setSection('dashboard');
    setFocusRecord(null);

    if (notifyServer && current?.accessToken) {
      try {
        await fetch(`${API_URL}/api/utilisateurs/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${current.accessToken}` },
        });
      } catch (error) {
        console.warn('La session locale a été fermée, mais la notification serveur a échoué.', error);
      }
    }
  };

  if (!session?.accessToken) {
    return <AuthPage onLogin={handleLogin} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  const currentUser = tables.employe.rows.find((a) => a.id === CURRENT_USER_ID) || tables.employe.rows[0];
  const notifications = tables.notification.rows;

  const markAllRead = () => {
    setTables((prev) => ({
      ...prev,
      notification: { ...prev.notification, rows: prev.notification.rows.map((n) => ({ ...n, lue: true })) },
    }));
  };

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
        sessionUser={session}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {section === 'dashboard' ? (
          <Dashboard tables={tables} onNavigate={navigate} onOpenRecord={openRecord} darkMode={darkMode} />
        ) : (
          <DataPage
            key={section}
            tableKey={section}
            tables={tables}
            setTables={setTables}
            focusRecordId={focusRecord?.table === section ? focusRecord.id : null}
            onFocusHandled={() => setFocusRecord(null)}
            darkMode={darkMode}
            accessToken={session.accessToken}
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
