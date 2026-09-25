import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Users,
  BriefcaseBusiness,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getOrganisationData } from '../../api/organisation';

function getInitials(agent) {
  const first = agent.prenom?.charAt(0) || '';
  const last = agent.nom?.charAt(0) || '';

  return `${first}${last}`.toUpperCase();
}

export default function OrganisationPage() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    services: [],
    postes: [],
    agents: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDirections, setExpandedDirections] = useState({});

  useEffect(() => {
    async function loadOrganisation() {
      try {
        setLoading(true);
        setError('');

        const result = await getOrganisationData();

        setData(result);
      } catch (err) {
        console.error(err);

        setError(
          "Impossible de charger les données de l'organisation."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrganisation();
  }, []);

  /*
   * Les directions sont déduites des services réellement
   * renseignés dans la base.
   *
   * Les services dont direction === null sont regroupés
   * séparément afin de ne rien inventer.
   */
  const organisation = useMemo(() => {
    const grouped = {};
    const withoutDirection = [];

    data.services.forEach((service) => {
      if (service.direction) {
        if (!grouped[service.direction]) {
          grouped[service.direction] = [];
        }

        grouped[service.direction].push(service);
      } else {
        withoutDirection.push(service);
      }
    });

    return {
      directions: Object.entries(grouped).map(
        ([name, services]) => ({
          name,
          services,
        })
      ),
      withoutDirection,
    };
  }, [data.services]);

  const totalAgents = data.agents.length;
  const totalServices = data.services.length;
  const totalPostes = data.postes.length;

  function toggleDirection(directionName) {
    setExpandedDirections((current) => ({
      ...current,
      [directionName]: !current[directionName],
    }));
  }

  function getAgentsForService(serviceCode) {
    return data.agents.filter(
      (agent) => agent.code_service === serviceCode
    );
  }

  function getPostesForService(serviceCode) {
    return data.postes.filter(
      (poste) => poste.code_service === serviceCode
    );
  }

  function getDirectionAgentCount(services) {
    return services.reduce(
      (total, service) =>
        total + getAgentsForService(service.code).length,
      0
    );
  }

  function renderService(service) {
    const agents = getAgentsForService(service.code);
    const postes = getPostesForService(service.code);

    return (
      <div
        className="organisation-service"
        key={service.id}
      >
        <div className="organisation-service-header">
          <div className="organisation-service-marker" />

          <div className="organisation-service-info">
            <div className="organisation-service-title-row">
              <strong>{service.nom}</strong>

              <span className="organisation-code">
                {service.code}
              </span>
            </div>

            <p>
              {service.description ||
                'Aucune description disponible.'}
            </p>
          </div>

          <div className="organisation-service-stats">
            <span title="Agents">
              <Users size={15} />
              {agents.length}
            </span>

            <span title="Postes">
              <BriefcaseBusiness size={15} />
              {postes.length}
            </span>
          </div>
        </div>

        {agents.length > 0 && (
          <div className="organisation-agent-list">
            {agents.map((agent) => (
              <button
                type="button"
                key={agent.id}
                className="organisation-agent"
                onClick={() =>
                  navigate(`/agents/${agent.id}`)
                }
              >
                <div className="organisation-agent-avatar">
                  {getInitials(agent)}
                </div>

                <div className="organisation-agent-content">
                  <strong>
                    {agent.prenom} {agent.nom}
                  </strong>

                  <span>
                    {agent.poste || 'Poste non renseigné'}
                  </span>
                </div>

                <span className="organisation-agent-matricule">
                  {agent.matricule}
                </span>
              </button>
            ))}
          </div>
        )}

        {agents.length === 0 && (
          <div className="organisation-empty-service">
            Aucun agent enregistré dans ce service.
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <section className="page-section">
        <div className="page-loading">
          Chargement de l'organisation...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="page-error">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="page-section organisation-page">
      {/* EN-TÊTE */}
      <div className="page-header">
        <div>
          <span className="page-eyebrow">
            STRUCTURE ADMINISTRATIVE
          </span>

          <h1>Organisation</h1>

          <p>
            Explorez la structure des directions, des services
            et des postes du ministère.
          </p>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="organisation-stats">
        <div className="organisation-stat-card">
          <div className="organisation-stat-icon">
            <Building2 size={20} />
          </div>

          <div>
            <strong>
              {organisation.directions.length}
            </strong>

            <span>Directions renseignées</span>
          </div>
        </div>

        <div className="organisation-stat-card">
          <div className="organisation-stat-icon">
            <Building2 size={20} />
          </div>

          <div>
            <strong>{totalServices}</strong>
            <span>Services</span>
          </div>
        </div>

        <div className="organisation-stat-card">
          <div className="organisation-stat-icon">
            <BriefcaseBusiness size={20} />
          </div>

          <div>
            <strong>{totalPostes}</strong>
            <span>Postes</span>
          </div>
        </div>

        <div className="organisation-stat-card">
          <div className="organisation-stat-icon">
            <Users size={20} />
          </div>

          <div>
            <strong>{totalAgents}</strong>
            <span>Agents</span>
          </div>
        </div>
      </div>

      {/* ORGANIGRAMME */}
      <div className="organisation-card">
        <div className="organisation-card-header">
          <div>
            <span className="page-eyebrow">
              ORGANIGRAMME
            </span>

            <h2>Structure administrative</h2>

            <p>
              Les éléments affichés correspondent aux données
              actuellement disponibles dans le système.
            </p>
          </div>
        </div>

        <div className="organisation-tree">
          {/* RACINE */}
          <div className="organisation-root">
            <div className="organisation-root-icon">
              <Building2 size={22} />
            </div>

            <div>
              <strong>
                Ministère des Budgets et des Finances
              </strong>

              <span>
                Structure administrative
              </span>
            </div>
          </div>

          <div className="organisation-tree-line" />

          {/* DIRECTIONS */}
          {organisation.directions.map((direction) => {
            const isOpen =
              expandedDirections[direction.name] ?? true;

            const agentCount =
              getDirectionAgentCount(direction.services);

            return (
              <div
                className="organisation-direction"
                key={direction.name}
              >
                <button
                  type="button"
                  className="organisation-direction-header"
                  onClick={() =>
                    toggleDirection(direction.name)
                  }
                >
                  <span className="organisation-expand">
                    {isOpen ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </span>

                  <span className="organisation-direction-icon">
                    <Building2 size={19} />
                  </span>

                  <span className="organisation-direction-info">
                    <strong>{direction.name}</strong>

                    <small>
                      {direction.services.length}{' '}
                      service
                      {direction.services.length > 1
                        ? 's'
                        : ''}{' '}
                      · {agentCount} agent
                      {agentCount > 1 ? 's' : ''}
                    </small>
                  </span>
                </button>

                {isOpen && (
                  <div className="organisation-services">
                    {direction.services.map(renderService)}
                  </div>
                )}
              </div>
            );
          })}

          {/* SERVICES SANS DIRECTION */}
          {organisation.withoutDirection.length > 0 && (
            <div className="organisation-unattached">
              <div className="organisation-unattached-header">
                <div className="organisation-unattached-icon">
                  <BriefcaseBusiness size={19} />
                </div>

                <div>
                  <strong>
                    Services sans direction renseignée
                  </strong>

                  <span>
                    {organisation.withoutDirection.length}{' '}
                    service
                    {organisation.withoutDirection.length > 1
                      ? 's'
                      : ''}{' '}
                    actuellement sans rattachement
                  </span>
                </div>
              </div>

              <div className="organisation-services">
                {organisation.withoutDirection.map(
                  renderService
                )}
              </div>
            </div>
          )}

          {/* AUCUNE DONNÉE */}
          {data.services.length === 0 && (
            <div className="organisation-empty">
              <UserRound size={24} />

              <strong>
                Aucune structure disponible
              </strong>

              <span>
                Aucun service n'est actuellement enregistré.
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}