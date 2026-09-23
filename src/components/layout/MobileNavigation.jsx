import React from 'react';

export default function MobileNavigation({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'employees', label: 'Employés', icon: '👥' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-around p-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center p-2 text-xs font-medium rounded-lg ${
            activeTab === item.id
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}