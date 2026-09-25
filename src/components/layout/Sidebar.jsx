import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  X,
  Plus,
  History,
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

const mainNavigation = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 'organisation',
    label: 'Organisation',
    icon: Building2,
    path: '/organisation',
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Users,
    path: '/agents',
  },
  {
    id: 'carrieres',
    label: 'Carrières',
    icon: BarChart3,
    path: '/carrieres',
  },
  {
    id: 'documents',
    label: 'Documents RH',
    icon: FileText,
    path: '/documents',
  },
  {
    id: 'activites',
    label: 'Mes activités',
    icon: Activity,
    path: '/activites',
  },
];

const documentNavigation = [
  {
    id: 'nouveau-document',
    label: 'Nouveau document',
    icon: Plus,
    path: '/documents/nouveau',
  },
  {
    id: 'historique-documents',
    label: 'Historique',
    icon: History,
    path: '/documents/historique',
  },
];

const administrationNavigation = [
  {
    id: 'administration',
    label: 'Administration',
    icon: Settings,
    path: '/administration',
  },
];

function NavigationItem({ item, onClose }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `sidebar-nav-item ${
          isActive ? 'sidebar-nav-item-active' : ''
        }`
      }
      onClick={onClose}
    >
      <Icon size={18} strokeWidth={1.8} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
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
      >
        <div className="sidebar-header">
          <NavLink
            to="/dashboard"
            className="sidebar-brand"
            onClick={onClose}
          >
            <div className="sidebar-brand-mark">
              <span>SY</span>
            </div>

            <div className="sidebar-brand-text">
              <div className="sidebar-brand-name">
                SYGPERS
              </div>

              <div className="sidebar-brand-subtitle">
                Gestion des ressources humaines
              </div>
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
          <p className="sidebar-section-label">
            Gestion RH
          </p>

          <div className="sidebar-nav-list">
            {mainNavigation.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                onClose={onClose}
              />
            ))}
          </div>

          <p className="sidebar-section-label sidebar-admin-label">
            Documents
          </p>

          <div className="sidebar-nav-list">
            {documentNavigation.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                onClose={onClose}
              />
            ))}
          </div>

          <p className="sidebar-section-label sidebar-admin-label">
            Configuration
          </p>

          <div className="sidebar-nav-list">
            {administrationNavigation.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                onClose={onClose}
              />
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
            <div className="sidebar-footer-icon">
              <BriefcaseBusiness size={16} />
            </div>

            <div>
              <strong>Espace RH</strong>
              <span>MEF Madagascar</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}