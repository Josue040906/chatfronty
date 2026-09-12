import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ExcelImporter from './components/ExcelImporter';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [history, setHistory] = useState([
    { id: 1, title: 'Analyse Poste 7 - Contrôleur' },
    { id: 2, title: 'Import Fichier Janvier' }
  ]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        history={history}
        onSelectChat={(item) => setActiveTab('chat')}
        onNewChat={() => setActiveTab('chat')}
      />
      {activeTab === 'chat' ? <ChatWindow /> : <ExcelImporter />}
    </div>
  );
}