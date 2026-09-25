import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';

import DashboardPage from '../../pages/Dashboard/DashboardPage';
import LoginPage from '../../pages/Login/LoginPage';
import AppLayout from '../../components/layout/AppLayout';
import AgentsPage from '../../pages/Agents/AgentsPage';
import AgentProfilePage from '../../pages/Agents/AgentProfilePage';
import CareerAnalysisPage from '../../pages/Carrieres/CareerAnalysisPage';
import OrganisationPage from '../../pages/Organisation/OrganisationPage';
import CarrieresPage from '../../pages/Carrieres/CarrieresPage';
import DocumentsPage from '../../pages/Documents/DocumentsPage';
import NewDocumentPage from '../../pages/Documents/NewDocumentPage';
import DocumentHistoryPage from '../../pages/Documents/DocumentHistoryPage';
import DocumentDetailsPage from '../../pages/Documents/DocumentDetailsPage';
import MesActivitesPage from '../../pages/Activites/MesActivitesPage';
import AdministrationPage from '../../pages/Administration/AdministrationPage';
import DirectionsPage from '../../pages/Administration/DirectionsPage';
import ServicesPage from '../../pages/Administration/ServicesPage';
import PostesPage from '../../pages/Administration/PostesPage';
import GradesPage from '../../pages/Administration/GradesPage';
import StatutsPage from '../../pages/Administration/StatutsPage';
import ReglesRhPage from '../../pages/Administration/ReglesRhPage';


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
          path="/agents/:id" 
          element={<AgentProfilePage />}
        />
        <Route
          path="/carrieres/:id/analyse"
          element={<CareerAnalysisPage />}
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
        path="/documents/nouveau"
        element={<NewDocumentPage />}
      />
      <Route
        path="/documents/:id"
        element={ <DocumentDetailsPage />}
      />



      <Route
        path="/documents/historique"
        element={<DocumentHistoryPage />}
      />
      <Route
        path="/activites"
        element={ <MesActivitesPage />}
      />
  
        <Route
          path="/assistant"
          element={<AssistantPage />}
        />

        
        <Route
          path="/administration/directions"
          element={<DirectionsPage />}
        />

        <Route
          path="/administration/services"
          element={<ServicesPage />}
        />
        <Route
          path="/administration/postes"
          element={<PostesPage />}
        />

        <Route
          path="/administration/grades"
          element={<GradesPage />}
        />

        <Route
          path="/administration/statuts"
          element={<StatutsPage />}
        />
<Route
path="/administration/regles-rh"
element={<ReglesRhPage />}
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