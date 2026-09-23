import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Search,
  Users,
} from 'lucide-react';

import { getDashboardData } from '../../api/dashboard';

function formatName(employee) {
  return `${employee.prenom || ''} ${employee.nom || ''}`.trim();
}

export default function DashboardPage() {
  const [data, setData] = useState({
    employees: [],
    services: [],
    postes: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const result = await getDashboardData();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(
            'Impossible de charger les données du tableau de bord.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const serviceStats = useMemo(() => {
    return data.services
      .map((service) => {
        const employees = data.employees.filter(
          (employee) =>
            employee.code_service === service.code
        );

        return {
          ...service,
          employeeCount: employees.length,
        };
      })
      .sort((a, b) => b.employeeCount - a.employeeCount);
  }, [data.services, data.employees]);

  const recentEmployees = data.employees.slice(0, 5);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          Chargement du tableau de bord...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <h1>Tableau de bord</h1>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-heading">
        <div>
          <p className="page-eyebrow">
            ESPACE DE TRAVAIL
          </p>

          <h1>Tableau de bord</h1>

          <p>
            Vue d'ensemble de l'environnement RH du ministère.
          </p>
        </div>

        <div className="dashboard-heading-mark">
          <Building2 size={20} />
        </div>
      </section>

      <section className="dashboard-stat-grid">
        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Users size={20} />
          </div>

          <div>
            <span>Agents</span>
            <strong>{data.employees.length}</strong>
            <small>agents enregistrés</small>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Building2 size={20} />
          </div>

          <div>
            <span>Services</span>
            <strong>{data.services.length}</strong>
            <small>services référencés</small>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <BriefcaseBusiness size={20} />
          </div>

          <div>
            <span>Postes</span>
            <strong>{data.postes.length}</strong>
            <small>postes référencés</small>
          </div>
        </article>
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-card dashboard-organisation-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-card-eyebrow">
                ORGANISATION
              </p>

              <h2>Répartition par service</h2>
            </div>
          </div>

          <div className="dashboard-service-list">
            {serviceStats.map((service) => (
              <div
                className="dashboard-service-row"
                key={service.id}
              >
                <div className="dashboard-service-info">
                  <strong>{service.code}</strong>

                  <span>{service.nom}</span>
                </div>

                <div className="dashboard-service-count">
                  {service.employeeCount}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-card-eyebrow">
                AGENTS
              </p>

              <h2>Agents enregistrés</h2>
            </div>

            <Search size={18} />
          </div>

          <div className="dashboard-employee-list">
            {recentEmployees.map((employee) => (
              <div
                className="dashboard-employee-row"
                key={employee.id}
              >
                <div className="dashboard-avatar">
                  {employee.prenom?.charAt(0)}
                  {employee.nom?.charAt(0)}
                </div>

                <div className="dashboard-employee-info">
                  <strong>{formatName(employee)}</strong>

                  <span>
                    {employee.poste || 'Poste non renseigné'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="dashboard-link-button"
            onClick={() => {
              window.location.href = '/agents';
            }}
          >
            Voir tous les agents
            <ArrowRight size={15} />
          </button>
        </article>
      </section>
    </div>
  );
}