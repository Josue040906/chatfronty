import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ExcelImporter from './components/ExcelImporter';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [darkMode, setDarkMode] = useState(true);
  const [history, setHistory] = useState([
    { id: 1, title: 'Idées de palette rose & bleu' },
    { id: 2, title: 'Plan de voyage à Antananarivo' },
    { id: 3, title: 'Corriger mon script Python' },
    { id: 4, title: 'Recette de gâteau au yaourt' },
    { id: 5, title: 'Résumé de réunion' }
  ]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        history={history}
        darkMode={darkMode}
        onSelectChat={(item) => setActiveTab('chat')}
        onNewChat={() => setActiveTab('chat')}
      />
      {activeTab === 'chat' ? (
        <ChatWindow darkMode={darkMode} setDarkMode={setDarkMode} />
      ) : (
        <ExcelImporter darkMode={darkMode} />
      )}
    </div>
  );
}