import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';

import DashboardPage from '../../pages/Dashboard/DashboardPage';
import LoginPage from '../../pages/Login/LoginPage';
import AppLayout from '../../components/layout/AppLayout';

function ProtectedLayout({ user, onLogout }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout
      user={user}
      onLogout={onLogout}
    >
      <Outlet />
    </AppLayout>
  );
}


function OrganisationPage() {
  return (
    <div className="page-placeholder">
      <div>
        <p className="page-placeholder-label">
          ORGANISATION
        </p>

        <h1>Organisation</h1>

        <p>
          Structure des directions, services et postes.
        </p>
      </div>
    </div>
  );
}

function AgentsPage() {
  return (
    <div className="page-placeholder">
      <div>
        <p className="page-placeholder-label">
          RESSOURCES HUMAINES
        </p>

        <h1>Agents</h1>

        <p>
          Consultation et gestion des agents du ministère.
        </p>
      </div>
    </div>
  );
}

function CarrieresPage() {
  return (
    <div className="page-placeholder">
      <div>
        <p className="page-placeholder-label">
          ÉVOLUTION PROFESSIONNELLE
        </p>

        <h1>Carrières</h1>

        <p>
          Analyse des parcours et possibilités d'évolution.
        </p>
      </div>
    </div>
  );
}

function DocumentsPage() {
  return (
    <div className="page-placeholder">
      <div>
        <p className="page-placeholder-label">
          DOCUMENTS RH
        </p>

        <h1>Documents RH</h1>

        <p>
          Création, consultation et suivi des documents administratifs.
        </p>
      </div>
    </div>
  );
}

function AssistantPage() {
  return (
    <div className="page-placeholder">
      <div>
        <p className="page-placeholder-label">
          INTELLIGENCE ARTIFICIELLE
        </p>

        <h1>Assistant</h1>

        <p>
          Votre assistant conversationnel RH bandI'Akam.
        </p>
      </div>
    </div>
  );
}

function AdministrationPage() {
  return (
    <div className="page-placeholder">
      <div>
        <p className="page-placeholder-label">
          CONFIGURATION
        </p>

        <h1>Administration</h1>

        <p>
          Paramétrage de la plateforme et des référentiels RH.
        </p>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="page-placeholder">
      <div>
        <p className="page-placeholder-label">
          ERREUR
        </p>

        <h1>Page introuvable</h1>

        <p>
          La page demandée n'existe pas.
        </p>
      </div>
    </div>
  );
}

export default function AppRouter({
  user,
  loading,
  login,
  logout,
}) {
  if (loading) {
    return (
      <div className="app-loading">
        Initialisation de l'application...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLogin={login} />
          )
        }
      />

      <Route
        element={
          <ProtectedLayout
            user={user}
            onLogout={logout}
          />
        }
      >
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/organisation"
          element={<OrganisationPage />}
        />

        <Route
          path="/agents"
          element={<AgentsPage />}
        />

        <Route
          path="/carrieres"
          element={<CarrieresPage />}
        />

        <Route
          path="/documents"
          element={<DocumentsPage />}
        />

        <Route
          path="/assistant"
          element={<AssistantPage />}
        />

        <Route
          path="/administration"
          element={<AdministrationPage />}
        />
      </Route>

      <Route
        path="*"
        element={
          user ? (
            <NotFoundPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}