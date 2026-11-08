import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Settings,
  Users,
  X,
  Plus,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { listerComptesEnAttente } from '../../api/utilisateurs';

const mainNavigation = [
  {
    id: 'dashboard',
    short: 'Accueil',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 'organisation',
    short: 'Organisation',
    label: 'Organisation',
    icon: Building2,
    path: '/organisation',
  },
  {
    id: 'agents',
    short: 'Agents',
    label: 'Agents',
    icon: Users,
    path: '/agents',
  },
  {
    id: 'carrieres',
    short: 'Carrières',
    label: 'Carrières',
    icon: BarChart3,
    path: '/carrieres',
  },
  {
    id: 'activites',
    short: 'Activités',
    label: 'Mes activités',
    icon: Activity,
    path: '/activites',
  },
];

const documentNavigation = [
  {
    id: 'documents',
    short: 'Documents',
    label: 'Documents RH',
    icon: FileText,
    path: '/documents',
  },
  {
    id: 'nouveau-document',
    short: 'Nouveau',
    label: 'Nouveau document',
    icon: Plus,
    path: '/documents/nouveau',
  },
];

const administrationNavigation = [
  {
    id: 'administration',
    short: 'Admin',
    label: 'Administration',
    icon: Settings,
    path: '/administration',
  },
];

function NavigationItem({ item, onClose, badge = 0 }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.path === '/documents' || item.path === '/administration'}
      className={({ isActive }) =>
        `sidebar-nav-item ${
          isActive ? 'sidebar-nav-item-active' : ''
        }`
      }
      onClick={onClose}
      title={item.label}
      aria-label={
        badge > 0
          ? `${item.label}, ${badge} en attente`
          : item.label
      }
    >
      <span className="sidebar-nav-icon">
        <Icon size={20} strokeWidth={1.75} />
        {badge > 0 && (
          <span className="sidebar-nav-badge" aria-hidden="true">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className="sidebar-nav-label">
        {item.short || item.label}
      </span>
    </NavLink>
  );
}

const demandesNavigation = {
  id: 'demandes-inscription',
  short: 'Demandes',
  label: 'Demandes d’inscription',
  icon: ShieldCheck,
  path: '/administration/demandes-inscription',
};

export default function Sidebar({ user, open, onClose }) {
  const isChef = user?.role === 'SPERS_CHEF';
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isChef) {
      return undefined;
    }

    let cancelled = false;

    listerComptesEnAttente()
      .then((result) => {
        if (!cancelled) {
          setPendingCount(Array.isArray(result) ? result.length : 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPendingCount(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isChef]);

  return (
    <>
      <div
        className={`sidebar-overlay ${
          open ? 'sidebar-overlay-visible' : ''
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`app-sidebar ${
          open ? 'app-sidebar-open' : ''
        }`}
        aria-label="Navigation principale"
      >
        <div className="sidebar-header">
          <NavLink
            to="/dashboard"
            className="sidebar-brand"
            onClick={onClose}
            title="SYGPERS – Gestion des ressources humaines"
          >
            <div className="sidebar-brand-mark">
              <span>SY</span>
            </div>
          </NavLink>

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-navigation">
          <div className="sidebar-nav-list">
            {mainNavigation.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                onClose={onClose}
              />
            ))}
          </div>

          <div className="sidebar-nav-list sidebar-nav-group">
            {documentNavigation.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                onClose={onClose}
              />
            ))}
          </div>

          <div className="sidebar-nav-list sidebar-nav-group">
            {administrationNavigation.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                onClose={onClose}
              />
            ))}
            {isChef && (
              <NavigationItem
                item={demandesNavigation}
                onClose={onClose}
                badge={pendingCount}
              />
            )}
          </div>
        </nav>

        <div className="sidebar-footer" title="Espace RH – MEF Madagascar">
          <BriefcaseBusiness size={16} />
        </div>
      </aside>
    </>
  );
}
