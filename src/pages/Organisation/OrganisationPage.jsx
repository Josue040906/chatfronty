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
import {
  getEmployeePhotoUrl,
  getEmployeeInitials,
} from '../../utils/employee';


/* =========================================================
   HELPERS
   ========================================================= */



function getAgentFullName(agent) {
  if (!agent) {
    return '';
  }

  return `${agent.prenom || ''} ${agent.nom || ''}`.trim();
}

function getPoste(agent) {
  return (agent?.poste || '').trim().toLowerCase();
}

function isDirector(agent) {
  return getPoste(agent) === 'directeur';
}

function isServiceResponsible(agent) {
  const poste = getPoste(agent);

  return (
    poste === 'chef de service' ||
    poste === 'chef de cellule'
  );
}

/*
 * Regroupe une liste par code_service, en une seule passe,
 * pour éviter de refiltrer l'ensemble des agents (ou des
 * postes) à chaque service et à chaque direction affichés.
 */
function groupByServiceCode(items) {
  const map = new Map();

  items.forEach((item) => {
    const code = item?.code_service;

    if (!code) {
      return;
    }

    if (!map.has(code)) {
      map.set(code, []);
    }

    map.get(code).push(item);
  });

  return map;
}

/* =========================================================
   AGENT — MINI CARTE
   ========================================================= */

/*
 * `role` distingue visuellement un responsable ("Responsable",
 * "Directeur") d'un agent ordinaire : avatar teinté, nom en
 * brun, bordure d'accent, et le rôle affiché directement dans
 * la carte plutôt que via une colonne d'étiquette séparée.
 */
function AgentMiniCard({
  agent,
  onClick,
  compact = false,
  role,
}) {
  if (!agent) {
    return null;
  }

  const photoUrl = getEmployeePhotoUrl(agent.photo);
  const fullName = getAgentFullName(agent);
  const isLead = Boolean(role);

  return (
    <button
      type="button"
      className={`organisation-agent-card ${
        compact ? 'organisation-agent-card--compact' : ''
      } ${
        isLead ? 'organisation-agent-card--lead' : ''
      }`}
      onClick={onClick}
      title={`${fullName}${
        role ? ` — ${role}` : ''
      } — ${agent.poste || 'Poste non renseigné'}`}
    >
      <div className="organisation-agent-photo">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={fullName}
          />
        ) : (
          <span>{getEmployeeInitials(agent)}</span>
        )}
      </div>

      <div className="organisation-agent-details">
        <strong>{fullName}</strong>

        <span>
          {role && (
            <span className="organisation-agent-role">
              {role} ·{' '}
            </span>
          )}
          {agent.matricule || 'Matricule non renseigné'}
        </span>

        {!compact && agent.poste && (
          <small>{agent.poste}</small>
        )}
      </div>
    </button>
  );
}

/* =========================================================
   SERVICE
   ========================================================= */

function ServiceNode({
  service,
  agents,
  postes,
  onAgentClick,
}) {
  /*
   * Le directeur appartient techniquement au service dans la
   * base de données, mais il doit être affiché au niveau de
   * la direction et non comme agent du service : on l'exclut
   * une seule fois, en amont du reste des calculs.
   */
  const serviceAgents = useMemo(
    () => agents.filter((agent) => !isDirector(agent)),
    [agents]
  );

  const responsable =
    serviceAgents.find(isServiceResponsible) || null;

  const autresAgents = useMemo(
    () =>
      serviceAgents.filter(
        (agent) => agent.id !== responsable?.id
      ),
    [serviceAgents, responsable]
  );

  return (
    <div className="organisation-service-node">
      <div className="organisation-service-box">
        <div className="organisation-service-code">
          {service.code}
        </div>

        <div className="organisation-service-main">
          <strong>{service.nom}</strong>

          <span>
            {serviceAgents.length} agent
            {serviceAgents.length > 1 ? 's' : ''}
            {' · '}
            {postes.length} poste
            {postes.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {responsable && (
        <div className="organisation-service-responsable">
          <AgentMiniCard
            agent={responsable}
            role="Responsable"
            compact
            onClick={() => onAgentClick(responsable.id)}
          />
        </div>
      )}

      {autresAgents.length > 0 && (
        <div className="organisation-service-agents">
          {autresAgents.map((agent) => (
            <AgentMiniCard
              key={agent.id}
              agent={agent}
              compact
              onClick={() => onAgentClick(agent.id)}
            />
          ))}
        </div>
      )}

      {agents.length === 0 && (
        <div className="organisation-service-empty">
          Aucun agent affecté à ce service.
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DIRECTION
   ========================================================= */

function DirectionNode({
  direction,
  getAgentsForService,
  getPostesForService,
  onAgentClick,
  isOpen,
  onToggle,
}) {
  /*
   * Les directeurs sont techniquement rattachés à un service
   * (SGEAE, SCS...) dans la base, mais leur champ "poste"
   * permet de les retrouver au bon niveau : celui de la
   * direction.
   */
  const directionAgents = useMemo(
    () =>
      direction.services.flatMap((service) =>
        getAgentsForService(service.code)
      ),
    [direction.services, getAgentsForService]
  );

  const responsable =
    directionAgents.find(isDirector) || null;

  const totalAgents = useMemo(
    () =>
      directionAgents.filter((agent) => !isDirector(agent))
        .length,
    [directionAgents]
  );

  return (
    <div className="organisation-direction-node">
      <div className="organisation-direction-box">
        <button
          type="button"
          className="organisation-direction-toggle"
          onClick={onToggle}
          aria-label={
            isOpen
              ? 'Réduire la direction'
              : 'Développer la direction'
          }
        >
          {isOpen ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>

        <div className="organisation-direction-icon">
          <Building2 size={18} />
        </div>

        <div className="organisation-direction-content">
          <strong>{direction.name}</strong>

          <span>
            {direction.services.length} service
            {direction.services.length > 1 ? 's' : ''}
            {' · '}
            {totalAgents} agent
            {totalAgents > 1 ? 's' : ''}
          </span>
        </div>

        {responsable && (
          <div className="organisation-direction-responsable">
            <AgentMiniCard
              agent={responsable}
              role="Directeur"
              compact
              onClick={(event) => {
                event.stopPropagation();
                onAgentClick(responsable.id);
              }}
            />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="organisation-direction-children">
          {direction.services.map((service) => (
            <ServiceNode
              key={service.id}
              service={service}
              agents={getAgentsForService(service.code)}
              postes={getPostesForService(service.code)}
              onAgentClick={onAgentClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function OrganisationPage() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    services: [],
    postes: [],
    agents: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDirections, setExpandedDirections] =
    useState({});

  useEffect(() => {
    async function loadOrganisation() {
      try {
        setLoading(true);
        setError('');

        const result = await getOrganisationData();

        setData({
          services: Array.isArray(result?.services)
            ? result.services
            : [],
          postes: Array.isArray(result?.postes)
            ? result.postes
            : [],
          agents: Array.isArray(result?.agents)
            ? result.agents
            : [],
        });
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
   * Construction des directions à partir du champ
   * service.direction renvoyé par l'API.
   */
  const organisation = useMemo(() => {
    const grouped = {};
    const withoutDirection = [];

    data.services.forEach((service) => {
      const directionName =
        service?.direction?.trim() || '';

      if (directionName) {
        if (!grouped[directionName]) {
          grouped[directionName] = [];
        }

        grouped[directionName].push(service);
      } else {
        withoutDirection.push(service);
      }
    });

    const directions = Object.entries(grouped)
      .map(([name, services]) => ({
        name,
        services: services.sort((a, b) =>
          String(a.code || '').localeCompare(
            String(b.code || '')
          )
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      directions,
      withoutDirection,
    };
  }, [data.services]);

  /*
   * Les agents et les postes sont regroupés par service une
   * seule fois par chargement de données, plutôt que refiltrés
   * pour chaque service et chaque direction à chaque rendu.
   */
  const agentsByService = useMemo(
    () => groupByServiceCode(data.agents),
    [data.agents]
  );

  const postesByService = useMemo(
    () => groupByServiceCode(data.postes),
    [data.postes]
  );

  const totalAgents = data.agents.length;
  const totalServices = data.services.length;
  const totalPostes = data.postes.length;

  function getAgentsForService(serviceCode) {
    return agentsByService.get(serviceCode) || [];
  }

  function getPostesForService(serviceCode) {
    return postesByService.get(serviceCode) || [];
  }

  function toggleDirection(directionName) {
    setExpandedDirections((current) => ({
      ...current,
      [directionName]: !current[directionName],
    }));
  }

  function openAgent(id) {
    navigate(`/agents/${id}`);
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
        <div className="page-error">{error}</div>
      </section>
    );
  }

  return (
    <section className="page-section organisation-page">
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

      <div className="organisation-card">
        <div className="organisation-card-header">
          <div>
            <span className="page-eyebrow">
              ORGANIGRAMME
            </span>

            <h2>Structure administrative</h2>

            <p>
              Les responsables sont affichés avec leur
              matricule et leur photo lorsqu'elle est
              disponible.
            </p>
          </div>
        </div>

        <div className="organisation-canvas">
          <div className="organisation-tree">
            {/* MINISTÈRE */}
            <div className="organisation-root">
              <div className="organisation-root-icon">
                <Building2 size={23} />
              </div>

              <div className="organisation-root-content">
                <strong>
                  Ministère des Budgets et des Finances
                </strong>

                <span>Structure administrative</span>
              </div>
            </div>

            <div className="organisation-root-connector" />

            {/* DIRECTIONS + SERVICES DIRECTS */}
            <div className="organisation-main-branches">
              {organisation.directions.map((direction) => {
                const isOpen =
                  expandedDirections[direction.name] ??
                  true;

                return (
                  <DirectionNode
                    key={direction.name}
                    direction={direction}
                    getAgentsForService={
                      getAgentsForService
                    }
                    getPostesForService={
                      getPostesForService
                    }
                    onAgentClick={openAgent}
                    isOpen={isOpen}
                    onToggle={() =>
                      toggleDirection(direction.name)
                    }
                  />
                );
              })}

              {organisation.withoutDirection.length > 0 && (
                <div className="organisation-direct-services">
                  <div className="organisation-direct-services-title">
                    <div className="organisation-direct-services-icon">
                      <BriefcaseBusiness size={18} />
                    </div>

                    <div>
                      <strong>
                        Services sans direction
                      </strong>

                      <span>
                        Services directement rattachés au
                        ministère
                      </span>
                    </div>
                  </div>

                  <div className="organisation-direct-services-grid">
                    {organisation.withoutDirection.map(
                      (service) => (
                        <ServiceNode
                          key={service.id}
                          service={service}
                          agents={getAgentsForService(
                            service.code
                          )}
                          postes={getPostesForService(
                            service.code
                          )}
                          onAgentClick={openAgent}
                        />
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {data.services.length === 0 && (
              <div className="organisation-empty">
                <UserRound size={24} />

                <strong>
                  Aucune structure disponible
                </strong>

                <span>
                  Aucun service n'est actuellement
                  enregistré.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}