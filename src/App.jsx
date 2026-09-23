import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MobileNavigation from './components/layout/MobileNavigation';
import PageContainer from './components/layout/PageContainer';
import Login from './components/pages/Login';
import LoadingState from './components/ui/LoadingState';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Initialisation de l'application..." />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header user={user} onLogout={logout} darkMode={darkMode} setDarkMode={setDarkMode} />
      
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <PageContainer
          title={
            activeTab === 'dashboard' ? 'Tableau de bord' :
            activeTab === 'employees' ? 'Gestion des Employés' : 'Paramètres'
          }
          description="Gérez les activités et les données de votre application"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300">
              Contenu de la section <strong>{activeTab}</strong>. Connecté en tant que <strong>{user.email}</strong>.
            </p>
          </div>
        </PageContainer>
      </div>

      <MobileNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}