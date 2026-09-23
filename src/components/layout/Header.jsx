import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  UserRound,
} from 'lucide-react';

export default function Header({
  user,
  onMenuClick,
  onLogout,
}) {
  const displayName = user?.name || user?.nom || user?.email || 'Utilisateur';

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="header-menu-button"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Rechercher un agent, un service..."
            aria-label="Recherche globale"
          />

          <span className="header-search-shortcut">
            Ctrl K
          </span>
        </div>
      </div>

      <div className="header-right">
        <button
          type="button"
          className="header-icon-button"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <div className="header-divider" />

        <div className="header-user">
          <div className="header-avatar">
            <UserRound size={17} />
          </div>

          <div className="header-user-info">
            <strong>{displayName}</strong>
            <span>Gestionnaire RH</span>
          </div>

          <button
            type="button"
            className="header-user-menu"
            onClick={onLogout}
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}