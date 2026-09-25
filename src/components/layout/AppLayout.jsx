import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AssistantFloating from '../assistant/AssistantFloating';

export default function AppLayout({ user, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-main">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
        />

        <main className="app-content">
          {children}
        </main>
      </div>

      {/* Assistant disponible sur toutes les pages protégées */}
      <AssistantFloating />
    </div>
  );
}