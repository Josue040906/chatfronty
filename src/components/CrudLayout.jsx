import React, { useState } from 'react';

const CrudLayout = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentTable, setCurrentTable] = useState('employees');

  return (
    <div className={darkMode ? 'dark bg-gray-900 text-white min-h-screen' : 'bg-gray-100 text-gray-900 min-h-screen'}>
      {/* Topbar de Navigation */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-white dark:bg-gray-800">
        <nav className="flex space-x-4">
          <button 
            onClick={() => setCurrentTable('employees')} 
            className={`px-3 py-2 rounded ${currentTable === 'employees' ? 'bg-blue-600 text-white' : ''}`}
          >
            Employés
          </button>
          <button 
            onClick={() => setCurrentTable('contracts')} 
            className={`px-3 py-2 rounded ${currentTable === 'contracts' ? 'bg-blue-600 text-white' : ''}`}
          >
            Contrats
          </button>
        </nav>

        <div className="flex items-center space-x-3">
          {/* Toggle Mode Sombre/Clair */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 border rounded border-gray-400"
          >
            {darkMode ? '☀️ Clair' : '🌙 Sombre'}
          </button>

          {/* Toggle Affichage Chatbot */}
          <button 
            onClick={() => setShowChat(!showChat)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            {showChat ? 'Masquer le Chat' : 'Ouvrir le Chat'}
          </button>
        </div>
      </header>

      {/* Zone Principale */}
      <div className="flex flex-1 relative">
        {/* Zone de la Table Active */}
        <main className={`p-6 transition-all duration-300 ${showChat ? 'w-3/4' : 'w-full'}`}>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold capitalize">Table : {currentTable}</h1>
            <div className="space-x-2">
              <input type="file" accept=".xlsx, .csv" className="hidden" id="excel-import" />
              <label htmlFor="excel-import" className="bg-emerald-600 text-white px-4 py-2 rounded cursor-pointer">
                Importer Excel
              </label>
              <button className="bg-blue-600 text-white px-4 py-2 rounded">
                + Ajouter Manuellement
              </button>
            </div>
          </div>

          {/* Tableau de Données avec Actions (Édition / Suppression) */}
          <div className="border rounded shadow bg-white dark:bg-gray-800 p-4">
            {/* Composant de table dynamique à insérer ici */}
            <p className="text-sm opacity-75">Barre de recherche et grilles de données pour {currentTable}...</p>
          </div>
        </main>

        {/* Panneau Latéral Escamotable pour le Chat */}
        {showChat && (
          <aside className="w-1/4 border-l border-gray-700 bg-white dark:bg-gray-800 p-4 min-h-[calc(100vh-65px)]">
            <h2 className="text-lg font-semibold mb-4">Assistant Chat</h2>
            {/* Composant Chatbot */}
          </aside>
        )}
      </div>
    </div>
  );
};

export default CrudLayout;