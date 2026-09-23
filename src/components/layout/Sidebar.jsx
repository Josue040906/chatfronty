import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

const mainNavigation = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
  },
  {
    id: 'organisation',
    label: 'Organisation',
    icon: Building2,
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Users,
  },
  {
    id: 'carrieres',
    label: 'Carrières',
    icon: BarChart3,
  },
  {
    id: 'documents',
    label: 'Documents RH',
    icon: FileText,
  },
  {
    id: 'assistant',
    label: 'Assistant',
    icon: Sparkles,
  },
];

const administrationNavigation = [
  {
    id: 'administration',
    label: 'Administration',
    icon: Settings,
  },
];

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
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark">
              <Sparkles size={18} strokeWidth={2} />
            </div>

            <div>
              <div className="sidebar-brand-name">
                bandI'Akam
              </div>

              <div className="sidebar-brand-subtitle">
                Assistant RH intelligent
              </div>
            </div>
          </div>

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
            Gestion des agents
          </p>

          <div className="sidebar-nav-list">
            {mainNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.id}
                  to={`/${item.id}`}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${
                      isActive
                        ? 'sidebar-nav-item-active'
                        : ''
                    }`
                  }
                  onClick={onClose}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <p className="sidebar-section-label sidebar-admin-label">
            Configuration
          </p>

          <div className="sidebar-nav-list">
            {administrationNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.id}
                  to={`/${item.id}`}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${
                      isActive
                        ? 'sidebar-nav-item-active'
                        : ''
                    }`
                  }
                  onClick={onClose}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
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