import {
  Activity,
  BarChart3,
  Building2,
  FilePlus2,
  FileText,
  GitBranch,
  LayoutDashboard,
  Mail,
  Plus,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { listerComptesEnAttente } from '../../api/utilisateurs';
import { getMessagesAgents } from '../../api/messagesAgents';

/*
 * Le menu en espaces : cinq entrées seulement dans la barre.
 * Un espace qui regroupe plusieurs pages ouvre un panneau qui les présente,
 * chacune avec une ligne d'explication. Un espace d'une seule page y mène directement.
 * Le bouton « + » rassemble les créations, accessibles depuis n'importe quel écran.
 * « personnel » : réservé au Service du Personnel ; « chef » : réservé au chef.
 */
const ESPACES = [
  {
    id: 'accueil',
    label: 'Accueil',
    icon: LayoutDashboard,
    description: 'Votre tableau de bord et ce que vous avez fait récemment.',
    pages: [
      { path: '/dashboard', label: 'Tableau de bord', hint: 'Chiffres clés et tâches du jour', icon: LayoutDashboard },
      { path: '/activites', label: 'Mes activités', hint: 'Ce que vous avez fait récemment', icon: Activity },
    ],
  },
  {
    id: 'personnel',
    label: 'Personnel',
    icon: Users,
    description: 'Les agents, leur carrière, et les postes à pourvoir ou à préparer.',
    pages: [
      { path: '/agents', label: 'Agents', hint: 'Fiches, dossiers et CV', icon: Users },
      { path: '/carrieres', label: 'Carrières', hint: 'Avancements, reclassements, simulations', icon: BarChart3 },
      { path: '/postes', label: 'Gestion des postes', hint: 'Postes libres, départs à venir, successeurs', icon: GitBranch, personnel: true },
    ],
  },
  {
    id: 'structure',
    label: 'Structure',
    icon: Building2,
    pages: [
      { path: '/organisation', label: 'Organisation', hint: 'Directions, services et postes', icon: Building2 },
    ],
  },
  {
    id: 'courrier',
    label: 'Courrier',
    icon: Mail,
    description: 'Les documents administratifs et les e-mails à envoyer aux agents.',
    pages: [
      { path: '/documents', label: 'Documents RH', hint: 'Arrêtés, décisions, attestations', icon: FileText },
      { path: '/messages', label: 'E-mails aux agents', hint: 'Relire et envoyer les e-mails préparés', icon: Mail, personnel: true, badge: 'emails' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Settings,
    description: 'Le paramétrage de l’application et les comptes.',
    pages: [
      { path: '/administration', label: 'Administration', hint: 'Directions, services, postes, parcours', icon: Settings },
      { path: '/administration/demandes-inscription', label: 'Demandes d’inscription', hint: 'Comptes à valider', icon: ShieldCheck, chef: true, badge: 'inscriptions' },
    ],
  },
];

// « action » : un raccourci de création, jamais affiché comme la page en cours.
const CREATIONS = [
  { path: '/documents/nouveau', label: 'Nouveau document', hint: 'Arrêté, décision, attestation…', icon: FilePlus2, action: true },
  { path: '/agents?nouveau=1', label: 'Ajouter un agent', hint: 'Créer la fiche d’un nouvel agent', icon: UserPlus, personnel: true, action: true },
];

/** L'espace auquel appartient la page affichée, pour le mettre en valeur dans la barre. */
function espaceCourant(pathname, espaces) {
  let meilleur = null;
  let longueur = 0;
  for (const espace of espaces) {
    for (const page of espace.pages) {
      const chemin = page.path.split('?')[0];
      const correspond = pathname === chemin || pathname.startsWith(`${chemin}/`);
      if (correspond && chemin.length > longueur) {
        meilleur = espace.id;
        longueur = chemin.length;
      }
    }
  }
  return meilleur;
}

function Pastille({ nombre, label }) {
  if (!nombre) return null;
  return (
    <span className="sidebar-nav-badge" aria-hidden="true" title={label}>
      {nombre > 99 ? '99+' : nombre}
    </span>
  );
}

function PanneauEspace({ id, titre, sousTitre, description, pages, compteurs, onNavigate, onClose }) {
  return (
    <section id={id} className="sidebar-flyout" aria-label={titre}>
      <header className="sidebar-flyout-header">
        <div>
          <p className="sidebar-flyout-eyebrow">{sousTitre}</p>
          <h2>{titre}</h2>
        </div>
        <button type="button" className="sidebar-flyout-close" onClick={onClose} aria-label="Fermer le panneau">
          <X size={16} />
        </button>
      </header>
      {description && <p className="sidebar-flyout-description">{description}</p>}
      <ul className="sidebar-flyout-list">
        {pages.map((page) => {
          const Icon = page.icon;
          const nombre = page.badge ? compteurs[page.badge] : 0;
          return (
            <li key={page.path}>
              <NavLink
                to={page.path}
                end={page.path === '/documents' || page.path === '/administration'}
                className={({ isActive }) => `sidebar-flyout-item${isActive && !page.action ? ' is-active' : ''}`}
                onClick={onNavigate}
              >
                <span className="sidebar-flyout-icon"><Icon size={18} strokeWidth={1.8} /></span>
                <span className="sidebar-flyout-text">
                  <strong>{page.label}</strong>
                  <span>{page.hint}</span>
                </span>
                {nombre > 0 && <span className="sidebar-flyout-count">{nombre}</span>}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function Sidebar({ user, open, onClose }) {
  const isChef = user?.role === 'SPERS_CHEF';
  const estPersonnel = isChef || user?.role === 'SPERS_AGENT';
  const autorise = (page) => (!page.personnel || estPersonnel) && (!page.chef || isChef);
  const { pathname } = useLocation();
  const [panneau, setPanneau] = useState(null);
  const [compteurs, setCompteurs] = useState({ inscriptions: 0, emails: 0 });
  const racine = useRef(null);

  const espaces = ESPACES
    .map((espace) => ({ ...espace, pages: espace.pages.filter(autorise) }))
    .filter((espace) => espace.pages.length > 0);
  const creations = CREATIONS.filter(autorise);
  const actif = espaceCourant(pathname, espaces);

  useEffect(() => {
    let annule = false;
    if (isChef) {
      listerComptesEnAttente()
        .then((r) => !annule && setCompteurs((c) => ({ ...c, inscriptions: Array.isArray(r) ? r.length : 0 })))
        .catch(() => {});
    }
    if (estPersonnel) {
      getMessagesAgents({ statut: 'PROPOSE' })
        .then((r) => !annule && setCompteurs((c) => ({ ...c, emails: r.length })))
        .catch(() => {});
    }
    return () => {
      annule = true;
    };
  }, [isChef, estPersonnel]);

  // Le panneau se ferme avec Échap ou un clic ailleurs.
  useEffect(() => {
    if (!panneau) return undefined;
    function surTouche(event) {
      if (event.key === 'Escape') setPanneau(null);
    }
    function surClic(event) {
      if (racine.current && !racine.current.contains(event.target)) setPanneau(null);
    }
    document.addEventListener('keydown', surTouche);
    document.addEventListener('mousedown', surClic);
    return () => {
      document.removeEventListener('keydown', surTouche);
      document.removeEventListener('mousedown', surClic);
    };
  }, [panneau]);

  function basculer(id) {
    setPanneau((courant) => (courant === id ? null : id));
  }

  function apresNavigation() {
    setPanneau(null);
    onClose();
  }

  const espaceOuvert = espaces.find((espace) => espace.id === panneau);
  const compteurEspace = (espace) =>
    espace.pages.reduce((total, page) => total + (page.badge ? compteurs[page.badge] || 0 : 0), 0);

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? 'sidebar-overlay-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div ref={racine} className={`sidebar-root${open ? ' sidebar-root-open' : ''}`}>
        <aside className={`app-sidebar ${open ? 'app-sidebar-open' : ''}`} aria-label="Navigation principale">
          <div className="sidebar-header">
            <NavLink
              to="/dashboard"
              className="sidebar-brand"
              onClick={apresNavigation}
              title="SYGPERS – Gestion des ressources humaines"
            >
              <div className="sidebar-brand-mark">
                <span>SY</span>
              </div>
            </NavLink>

            <button type="button" className="sidebar-close" onClick={onClose} aria-label="Fermer le menu">
              <X size={18} />
            </button>
          </div>

          {creations.length > 0 && (
            <button
              type="button"
              className={`sidebar-create${panneau === 'creer' ? ' is-open' : ''}`}
              onClick={() => basculer('creer')}
              aria-expanded={panneau === 'creer'}
              aria-controls="sidebar-panneau-creer"
              aria-label="Créer : nouveau document, nouvel agent"
              title="Créer"
            >
              <Plus size={22} strokeWidth={2.4} />
            </button>
          )}

          <nav className="sidebar-navigation">
            {espaces.map((espace) => {
              const Icon = espace.icon;
              const nombre = compteurEspace(espace);
              const classe = `sidebar-nav-item${actif === espace.id ? ' sidebar-nav-item-active' : ''}${
                panneau === espace.id ? ' sidebar-nav-item-open' : ''
              }`;
              const contenu = (
                <>
                  <span className="sidebar-nav-icon">
                    <Icon size={20} strokeWidth={1.75} />
                    <Pastille nombre={nombre} label={`${nombre} en attente`} />
                  </span>
                  <span className="sidebar-nav-label">{espace.label}</span>
                </>
              );
              const etiquette = nombre > 0 ? `${espace.label}, ${nombre} en attente` : espace.label;

              if (espace.pages.length === 1) {
                return (
                  <NavLink
                    key={espace.id}
                    to={espace.pages[0].path}
                    className={classe}
                    onClick={apresNavigation}
                    title={espace.pages[0].label}
                    aria-label={etiquette}
                  >
                    {contenu}
                  </NavLink>
                );
              }
              return (
                <button
                  key={espace.id}
                  type="button"
                  className={classe}
                  onClick={() => basculer(espace.id)}
                  aria-expanded={panneau === espace.id}
                  aria-controls={`sidebar-panneau-${espace.id}`}
                  aria-label={etiquette}
                  title={espace.label}
                >
                  {contenu}
                </button>
              );
            })}
          </nav>
        </aside>

        {espaceOuvert && (
          <PanneauEspace
            id={`sidebar-panneau-${espaceOuvert.id}`}
            titre={espaceOuvert.label}
            sousTitre="Espace"
            description={espaceOuvert.description}
            pages={espaceOuvert.pages}
            compteurs={compteurs}
            onNavigate={apresNavigation}
            onClose={() => setPanneau(null)}
          />
        )}
        {panneau === 'creer' && (
          <PanneauEspace
            id="sidebar-panneau-creer"
            titre="Créer"
            sousTitre="Nouveau"
            description="Les créations, à portée de main depuis n’importe quel écran."
            pages={creations}
            compteurs={compteurs}
            onNavigate={apresNavigation}
            onClose={() => setPanneau(null)}
          />
        )}
      </div>
    </>
  );
}
