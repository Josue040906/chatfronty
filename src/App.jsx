import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import CrudModule from './components/CrudModule';

export default function App() {
  // 'chat' : sidebar + fenêtre de discussion. 'crud' : module de données plein écran (sans sidebar).
  const [mode, setMode] = useState('chat');
  const [darkMode, setDarkMode] = useState(true);
  const [history, setHistory] = useState([
    { id: 1, title: 'Recherche de candidats — Contrôleur financier' },
    { id: 2, title: "Compétences de l'équipe Informatique" },
    { id: 3, title: 'Postes vacants à pourvoir' },
    { id: 4, title: 'Analyse du profil de Jean RAKOTO' },
    { id: 5, title: 'Comparatif de deux candidats' }
  ]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      {mode === 'chat' && (
        <Sidebar
          activeTab={mode}
          setActiveTab={setMode}
          history={history}
          darkMode={darkMode}
          onSelectChat={() => setMode('chat')}
          onNewChat={() => setMode('chat')}
        />
      )}

      {mode === 'chat' ? (
        <ChatWindow darkMode={darkMode} setDarkMode={setDarkMode} />
      ) : (
        <CrudModule darkMode={darkMode} setDarkMode={setDarkMode} onBackToChat={() => setMode('chat')} />
      )}
    </div>
  );
}