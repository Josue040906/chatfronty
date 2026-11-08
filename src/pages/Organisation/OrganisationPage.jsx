import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Building2,
  CircleHelp,
  Maximize,
  Minus,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getOrganisationData } from '../../api/organisation';
import EmployeePhoto from '../../components/EmployeePhoto';
import {
  getEmployeeInitials,
  getEmployeePhotoUrl,
} from '../../utils/employee';

const MINISTRY_NAME = 'Ministère de l’Économie et des Finances';
const DIRECTION_WIDTH = 250;
const DIRECTION_HEIGHT = 100;
const SERVICE_WIDTH = 280;
const SERVICE_HEIGHT = 68;
const SERVICE_GAP = 16;
const SERVICE_COLUMN_GAP = 90;
const GROUP_COLUMN_GAP = 120;
const DIRECTION_SERVICE_GAP = 44;
const DIRECTION_X = 70;
const MINISTRY_WIDTH = 220;

function normalized(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('fr');
}

function getAgentName(agent) {
  return [agent?.prenom, agent?.nom].filter(Boolean).join(' ').trim();
}

function getServiceCode(service) {
  return service?.code || service?.code_service || '';
}

function isDirector(agent) {
  return normalized(agent?.poste) === 'directeur';
}

function isServiceManager(agent) {
  const poste = normalized(agent?.poste);
  return poste === 'chef de service' || poste === 'chef de cellule';
}

function groupByServiceCode(items) {
  const grouped = new Map();

  items.forEach((item) => {
    const code = normalized(
      item?.code_service || item?.codeService || item?.service?.code
    );
    if (!code) return;
    if (!grouped.has(code)) grouped.set(code, []);
    grouped.get(code).push(item);
  });

  return grouped;
}

function getServiceAgents(agentsByService, serviceCode) {
  return agentsByService.get(normalized(serviceCode)) || [];
}

function InvisibleHandles() {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="org-handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="org-handle"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="org-handle"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="org-handle"
      />
    </>
  );
}

function MinistryBranchEdge({ id, sourceX, sourceY, targetX, targetY, style }) {
  const branchY = sourceY + 48;
  const path = `M ${sourceX},${sourceY} V ${branchY} H ${targetX} V ${targetY}`;

  return (
    <path
      id={id}
      d={path}
      className="react-flow__edge-path org-ministry-branch-path"
      style={style}
      fill="none"
    />
  );
}

function ServiceBranchEdge({ id, sourceX, sourceY, targetX, targetY, style }) {
  const trunkX = sourceX + (targetX - sourceX) / 2;
  const trunkY = sourceY + 32;
  const path = `M ${sourceX},${sourceY} V ${trunkY} H ${trunkX} V ${targetY} H ${targetX}`;

  return (
    <path
      id={id}
      d={path}
      className="react-flow__edge-path org-service-branch-path"
      style={style}
      fill="none"
    />
  );
}

const edgeTypes = {
  ministryBranch: MinistryBranchEdge,
  serviceBranch: ServiceBranchEdge,
};

function MinistryNode({ data }) {
  return (
    <div className="org-ministry-node">
      <InvisibleHandles />
      <span className="org-eyebrow-light">Ministère</span>
      <strong>{data.directionCount} {data.directionCount > 1 ? 'directions' : 'direction'}</strong>
      <small>{data.agentCount} {data.agentCount > 1 ? 'agents' : 'agent'}</small>
    </div>
  );
}

function DirectionNode({ data }) {
  return (
    <div className="org-node-wrap">
      <InvisibleHandles />
      <button
        type="button"
        className="org-direction-node nodrag nopan"
        onClick={() => data.onSelect(data.direction)}
        aria-label={`Ouvrir la direction ${data.name} et consulter ${data.agentCount} agents`}
      >
        <strong className="org-direction-name">{data.name}</strong>
        <span className="org-direction-meta">
          {data.serviceCount} {data.serviceCount === 1 ? 'service' : 'services'}
          {' · '}
          {data.agentCount} {data.agentCount === 1 ? 'agent' : 'agents'}
        </span>
        <span className={`org-leader ${data.leader ? '' : 'org-leader-empty'}`}>
          Directeur : {data.leader || 'Non renseigné'}
        </span>
      </button>
    </div>
  );
}

function ServiceNode({ data }) {
  return (
    <div className="org-node-wrap">
      <InvisibleHandles />
      <button
        type="button"
        className={`org-service-node nodrag nopan ${data.isSelected ? 'is-selected' : ''}`}
        onClick={() => data.onSelect(data.service)}
        aria-label={`Ouvrir le service ${data.service.nom} et consulter ${data.agentCount} agents`}
      >
        <span className="org-service-copy">
          <strong>{data.service.nom}</strong>
          <small>
            {data.agentCount} {data.agentCount === 1 ? 'agent' : 'agents'}
            {data.leader ? ` · ${data.leader}` : ''}
          </small>
        </span>
        <span className="org-service-code">
          {data.hasDirection === false ? 'Sans direction' : getServiceCode(data.service)}
        </span>
      </button>
    </div>
  );
}

const nodeTypes = {
  ministry: MinistryNode,
  direction: DirectionNode,
  service: ServiceNode,
};

const AVATAR_TONES = ['gold', 'green', 'blue', 'red'];

function AgentAvatar({ agent, index }) {
  const photo = getEmployeePhotoUrl(agent?.photo);
  return (
    <span className={`org-avatar org-avatar-${AVATAR_TONES[index % AVATAR_TONES.length]}`} aria-hidden="true">
      {getEmployeeInitials(agent) || '?'}
      {photo && <EmployeePhoto src={photo} alt="" />}
    </span>
  );
}

/**
 * Fenêtre d'effectif, commune aux services et aux directions.
 * `services` (facultatif) active les filtres par service.
 */
function OrgAgentsDialog({
  eyebrow,
  title,
  subtitle,
  agents,
  services,
  serviceNames,
  showManagerTag,
  onClose,
  onAgentClick,
}) {
  const [query, setQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const serviceCounts = useMemo(() => {
    const counts = new Map();
    (services || []).forEach((service) => {
      const code = normalized(getServiceCode(service));
      counts.set(code, agents.filter((agent) =>
        normalized(agent?.code_service || agent?.codeService || agent?.service?.code) === code
      ).length);
    });
    return counts;
  }, [agents, services]);

  const filteredAgents = useMemo(() => {
    const search = normalized(query);
    return agents.filter((agent) => {
      if (serviceFilter) {
        const code = normalized(
          agent?.code_service || agent?.codeService || agent?.service?.code
        );
        if (code !== serviceFilter) return false;
      }
      if (!search) return true;
      return normalized([agent.matricule, agent.nom, agent.prenom].join(' ')).includes(search);
    });
  }, [agents, query, serviceFilter]);

  return (
    <div
      className="org-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="org-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="org-dialog-title"
      >
        <header className="org-dialog-header">
          <div>
            <span className="rf-eyebrow">{eyebrow}</span>
            <h2 id="org-dialog-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="rf-icon-btn"
            onClick={onClose}
            aria-label="Fermer la liste des agents"
          >
            <X size={18} />
          </button>
        </header>

        <p className="org-dialog-hint">Sélectionnez une carte pour ouvrir le profil</p>

        {services && services.length > 1 && (
          <div className="org-dialog-chips" role="group" aria-label="Filtrer par service">
            <button
              type="button"
              className="rf-chip"
              aria-pressed={serviceFilter === ''}
              onClick={() => setServiceFilter('')}
            >
              Tous les services <span>{agents.length}</span>
            </button>
            {services.map((service) => {
              const code = normalized(getServiceCode(service));
              return (
                <button
                  type="button"
                  key={service.id}
                  className="rf-chip"
                  aria-pressed={serviceFilter === code}
                  onClick={() => setServiceFilter(code)}
                >
                  {service.nom} <span>{serviceCounts.get(code) || 0}</span>
                </button>
              );
            })}
          </div>
        )}

        <label className="rf-search org-dialog-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par nom ou matricule"
            aria-label="Rechercher un agent par nom ou matricule"
          />
          {query && (
            <button type="button" className="org-clear" onClick={() => setQuery('')} aria-label="Effacer la recherche">
              <X size={15} />
            </button>
          )}
        </label>

        <div className="org-agent-list" aria-live="polite">
          {filteredAgents.length > 0 ? filteredAgents.map((agent, index) => {
            const serviceName = serviceNames?.get(normalized(
              agent?.code_service || agent?.codeService || agent?.service?.code
            ));
            return (
              <button
                className="org-agent-card"
                type="button"
                key={agent.id}
                onClick={() => onAgentClick(agent.id)}
                aria-label={`Ouvrir le profil de ${getAgentName(agent) || 'cet agent'}`}
              >
                <AgentAvatar agent={agent} index={index} />
                <span className="org-agent-identity">
                  <strong>{getAgentName(agent) || 'Nom non renseigné'}</strong>
                  <small>{agent.poste || 'Poste non renseigné'}</small>
                  <span className="org-agent-matricule">{agent.matricule || 'Matricule non renseigné'}</span>
                </span>
                {showManagerTag && isServiceManager(agent) ? (
                  <span className="org-agent-tag org-agent-tag-chief">Chef de service</span>
                ) : serviceName ? (
                  <span className="org-agent-tag">{serviceName}</span>
                ) : null}
              </button>
            );
          }) : (
            <div className="org-dialog-empty">
              <CircleHelp size={22} />
              <strong>{agents.length ? 'Aucun résultat' : 'Aucun agent rattaché'}</strong>
              <span>
                {agents.length
                  ? 'Essayez un autre nom ou matricule.'
                  : 'Aucun agent n’est actuellement associé ici.'}
              </span>
            </div>
          )}
        </div>
        <footer className="org-dialog-footer">Appuyez sur Échap pour fermer</footer>
      </section>
    </div>
  );
}

function buildOrganisation(services, agents) {
  const agentsByService = groupByServiceCode(agents);
  const directionGroups = new Map();
  const directServices = [];

  services.forEach((service) => {
    const directionValue = service?.direction;
    const directionName = typeof directionValue === 'string'
      ? directionValue.trim()
      : String(directionValue?.nom || directionValue?.name || '').trim();
    const directionId = service?.direction_id ?? service?.directionId
      ?? directionValue?.id;

    if (directionId == null && !directionName) {
      directServices.push(service);
      return;
    }

    const groupId = directionId != null
      ? `id:${directionId}`
      : `name:${normalized(directionName)}`;
    if (!directionGroups.has(groupId)) {
      directionGroups.set(groupId, {
        id: groupId,
        name: directionName || `Direction #${directionId} (nom non renseigné)`,
        services: [],
      });
    }
    directionGroups.get(groupId).services.push(service);
  });

  const directions = [...directionGroups.values()]
    .map((direction) => {
      const directionAgents = direction.services
        .flatMap((service) =>
          agentsByService.get(normalized(getServiceCode(service))) || []
        )
        .filter((agent) => !isDirector(agent));
      const uniqueDirectionAgents = new Map(
        directionAgents.map((agent) => [agent.id, agent])
      );

      return {
        ...direction,
        services: direction.services.sort((a, b) =>
          String(a.nom || '').localeCompare(String(b.nom || ''), 'fr')
        ),
        leaders: direction.services
          .flatMap((service) =>
            agentsByService.get(normalized(getServiceCode(service))) || []
          )
          .filter(isDirector),
        agentCount: uniqueDirectionAgents.size,
        allAgents: [...new Map(
          direction.services
            .flatMap((service) =>
              agentsByService.get(normalized(getServiceCode(service))) || []
            )
            .map((agent) => [agent.id, agent])
        ).values()],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  return { directions, directServices, agentsByService };
}

export default function OrganisationPage() {
  const navigate = useNavigate();
  const flowRef = useRef(null);
  const [data, setData] = useState({ services: [], postes: [], agents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [structureQuery, setStructureQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOrganisation() {
      setLoading(true);
      setError('');
      try {
        const result = await getOrganisationData();
        if (!cancelled) {
          setData({
            services: Array.isArray(result?.services) ? result.services : [],
            postes: Array.isArray(result?.postes) ? result.postes : [],
            agents: Array.isArray(result?.agents) ? result.agents : [],
          });
        }
      } catch (loadError) {
        console.error('Impossible de charger les données de l’organisation.', loadError);
        if (!cancelled) {
          setError(loadError?.message || 'Impossible de charger les données de l’organisation.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrganisation();
    return () => {
      cancelled = true;
    };
  }, []);

  const organisation = useMemo(
    () => buildOrganisation(data.services, data.agents),
    [data.services, data.agents]
  );

  const selectService = useCallback((service) => {
    setSelectedServiceId(service.id);
    setSelectedService(service);
  }, []);

  const selectDirection = useCallback((direction) => {
    setSelectedDirection(direction);
  }, []);

  const visibleGroups = useMemo(() => {
    const query = normalized(structureQuery);
    const directions = organisation.directions.flatMap((direction) => {
      if (!query || normalized(direction.name).includes(query)) {
        return [{
          type: 'direction',
          id: direction.id,
          direction,
          services: direction.services,
        }];
      }

      const matchingServices = direction.services.filter((service) =>
        normalized(`${service.nom} ${getServiceCode(service)}`).includes(query)
      );
      return matchingServices.length
        ? [{
          type: 'direction',
          id: direction.id,
          direction,
          services: matchingServices,
        }]
        : [];
    });
    const directServices = organisation.directServices
      .filter((service) =>
        !query || normalized(`${service.nom} ${getServiceCode(service)}`).includes(query)
      )
      .map((service) => ({
        type: 'direct-service',
        id: `service:${service.id}`,
        services: [service],
      }));

    return [...directions, ...directServices];
  }, [organisation, structureQuery]);

  const { nodes, edges } = useMemo(() => {
    const groups = visibleGroups;
    const directionGroups = groups.filter((group) => group.type === 'direction');
    const unassignedServices = groups
      .filter((group) => group.type === 'direct-service')
      .flatMap((group) => group.services);
    const groupColumnWidth =
      DIRECTION_WIDTH + SERVICE_COLUMN_GAP + SERVICE_WIDTH + GROUP_COLUMN_GAP;
    const unassignedColumnWidth = unassignedServices.length
      ? SERVICE_COLUMN_GAP + SERVICE_WIDTH + GROUP_COLUMN_GAP
      : 0;
    const chartWidth = Math.max(
      1084,
      DIRECTION_X
        + directionGroups.length * groupColumnWidth
        + unassignedColumnWidth
        + 70
    );
    const rootNode = {
      id: 'ministry',
      type: 'ministry',
      position: { x: (chartWidth - MINISTRY_WIDTH) / 2, y: 24 },
      data: {
        directionCount: organisation.directions.length,
        agentCount: data.agents.length,
      },
      draggable: false,
      selectable: false,
    };
    const directionNodes = [];
    const serviceNodes = [];
    const builtEdges = [];
    const groupY = 205;
    let directionIndex = 0;

    groups.forEach((group) => {
      if (group.type === 'direction') {
        const directionNodeId = `direction:${group.id}`;
        const directionX = DIRECTION_X + directionIndex * groupColumnWidth;
        const serviceX = directionX + DIRECTION_WIDTH + SERVICE_COLUMN_GAP;
        const leader = group.direction.leaders[0];

        directionNodes.push({
          id: directionNodeId,
          type: 'direction',
          position: { x: directionX, y: groupY },
          data: {
            direction: group.direction,
            onSelect: selectDirection,
            name: group.direction.name,
            serviceCount: group.services.length,
            agentCount: group.direction.allAgents.length,
            leader: leader ? getAgentName(leader) || 'Nom non renseigné' : '',
          },
          draggable: false,
          selectable: false,
        });
        builtEdges.push({
          id: `ministry-${directionNodeId}`,
          source: 'ministry',
          sourceHandle: 'bottom-source',
          target: directionNodeId,
          targetHandle: 'top-target',
          type: 'ministryBranch',
          style: { stroke: 'var(--color-accent)', strokeWidth: 1.5 },
        });

        group.services.forEach((service, serviceIndex) => {
          const serviceAgentsForNode = getServiceAgents(
            organisation.agentsByService,
            getServiceCode(service)
          );
          const manager = serviceAgentsForNode.find(isServiceManager);
          const nodeId = `service:${service.id}`;
          const serviceY = groupY + DIRECTION_HEIGHT + DIRECTION_SERVICE_GAP
            + serviceIndex * (SERVICE_HEIGHT + SERVICE_GAP);

          serviceNodes.push({
            id: nodeId,
            type: 'service',
            position: { x: serviceX, y: serviceY },
            data: {
              service,
              hasDirection: true,
              agentCount: serviceAgentsForNode.length,
              leader: manager ? getAgentName(manager) || 'Nom non renseigné' : '',
              isSelected: selectedServiceId === service.id,
              onSelect: selectService,
            },
            draggable: false,
            selectable: false,
          });
          builtEdges.push({
            id: `${directionNodeId}-${nodeId}`,
            source: directionNodeId,
            sourceHandle: 'bottom-source',
            target: nodeId,
            targetHandle: 'left-target',
            type: 'serviceBranch',
            style: { stroke: 'var(--color-border-strong)', strokeWidth: 1.4 },
          });
        });

        directionIndex += 1;
      } else {
        const serviceX = DIRECTION_X
          + directionGroups.length * groupColumnWidth
          + SERVICE_COLUMN_GAP;

        group.services.forEach((service, serviceIndex) => {
          const serviceAgentsForNode = getServiceAgents(
            organisation.agentsByService,
            getServiceCode(service)
          );
          const manager = serviceAgentsForNode.find(isServiceManager);
          const nodeId = `service:${service.id}`;

          serviceNodes.push({
            id: nodeId,
            type: 'service',
            position: {
              x: serviceX,
              y: groupY + serviceIndex * (SERVICE_HEIGHT + SERVICE_GAP),
            },
            data: {
              service,
              hasDirection: false,
              agentCount: serviceAgentsForNode.length,
              leader: manager ? getAgentName(manager) || 'Nom non renseigné' : '',
              isSelected: selectedServiceId === service.id,
              onSelect: selectService,
            },
            draggable: false,
            selectable: false,
          });
        });
      }
    });

    return {
      nodes: [rootNode, ...directionNodes, ...serviceNodes],
      edges: builtEdges,
    };
  }, [data.agents.length, organisation, selectedServiceId, selectDirection, selectService, visibleGroups]);

  const closeServiceDialog = useCallback(() => setSelectedService(null), []);
  const closeDirectionDialog = useCallback(() => setSelectedDirection(null), []);
  const openAgent = useCallback((id) => {
    setSelectedService(null);
    setSelectedDirection(null);
    navigate(`/agents/${id}`);
  }, [navigate]);

  const serviceAgents = selectedService
    ? getServiceAgents(organisation.agentsByService, selectedService.code)
    : [];
  const serviceNames = useMemo(
    () => new Map(data.services.map((service) => [
      normalized(getServiceCode(service)),
      service.nom,
    ])),
    [data.services]
  );
  const unassignedAgents = useMemo(
    () => data.agents.filter((agent) =>
      !serviceNames.has(normalized(
        agent?.code_service || agent?.codeService || agent?.service?.code
      ))
    ).length,
    [data.agents, serviceNames]
  );
  const totalAgents = data.agents.length;
  const totalDirectors = organisation.directions.length;
  const totalServices = data.services.length;
  const fitDiagram = useCallback(() => {
    flowRef.current?.fitView({
      padding: 0.1,
      minZoom: 0.18,
      maxZoom: 1.05,
      duration: 350,
    });
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      flowRef.current?.fitView({
        padding: 0.1,
        minZoom: 0.18,
        maxZoom: 1.05,
        duration: 280,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [structureQuery]);

  if (loading) {
    return (
      <section className="page-section organisation-page">
        <div className="org-state-card" role="status">
          <span className="org-loading-mark"><Building2 size={22} /></span>
          <strong>Préparation de l’organigramme</strong>
          <span>Chargement de la structure administrative…</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section organisation-page">
        <div className="org-state-card org-state-error" role="alert">
          <span className="org-loading-mark"><CircleHelp size={22} /></span>
          <strong>Organigramme indisponible</strong>
          <span>{error}</span>
          <button type="button" onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section organisation-page rf-page">
      <header className="rf-head">
        <div>
          <p className="rf-eyebrow">Ministère de l’Économie et des Finances</p>
          <h1 className="rf-title">Organigramme</h1>
          <p className="rf-lead">
            Directions, services et agents du ministère. Explorez les directions, les services et leurs effectifs.
          </p>
        </div>
        <div className="org-head-tools">
          <span className="org-current-pill">Structure actuelle</span>
          <button
            type="button"
            className="org-tool"
            onClick={() => flowRef.current?.zoomOut({ duration: 180 })}
            aria-label="Zoom arrière"
          >
            <Minus size={18} />
          </button>
          <button
            type="button"
            className="org-tool"
            onClick={() => flowRef.current?.zoomIn({ duration: 180 })}
            aria-label="Zoom avant"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            className="org-tool"
            onClick={fitDiagram}
            aria-label="Recentrer et ajuster l’organigramme"
          >
            <Maximize size={16} />
          </button>
        </div>
      </header>

      <div className="org-stats" aria-label="Indicateurs de la structure">
        <span><strong>{totalDirectors}</strong> Directions</span>
        <span><strong>{totalServices}</strong> Services</span>
        <span><strong>{totalAgents}</strong> Agents référencés</span>
      </div>

      <section className="rf-card org-workspace" aria-label="Organigramme interactif">
        <div className="org-structure-bar">
          <label className="rf-search org-structure-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={structureQuery}
              onChange={(event) => setStructureQuery(event.target.value)}
              placeholder="Rechercher une direction ou un service"
              aria-label="Rechercher une direction ou un service"
            />
            {structureQuery && (
              <button
                type="button"
                className="org-clear"
                onClick={() => setStructureQuery('')}
                aria-label="Effacer la recherche"
              >
                <X size={14} />
              </button>
            )}
          </label>
        </div>
        <div className="org-flow-shell">
          {totalServices === 0 ? (
            <div className="org-empty">
              <span className="org-empty-icon"><Building2 size={23} /></span>
              <strong>Aucune structure disponible</strong>
              <span>Aucun service n’est actuellement enregistré dans le référentiel.</span>
            </div>
          ) : visibleGroups.length === 0 ? (
            <div className="org-empty org-filter-empty">
              <span className="org-empty-icon"><Search size={22} /></span>
              <strong>Aucun résultat pour « {structureQuery} »</strong>
              <span>Essayez un autre nom ou code de direction ou de service.</span>
              <button type="button" className="rf-btn" onClick={() => setStructureQuery('')}>
                Effacer la recherche
              </button>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onInit={(instance) => { flowRef.current = instance; }}
              onNodeClick={(_, node) => {
                if (node.type === 'service') {
                  selectService(node.data.service);
                }
              }}
              fitView
              fitViewOptions={{ padding: 0.1, minZoom: 0.18, maxZoom: 1.05 }}
              minZoom={0.12}
              maxZoom={1.5}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{ type: 'smoothstep' }}
              aria-label={`Organigramme du ministère, ${totalDirectors} directions et ${totalServices} services`}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={22}
                size={1.2}
                color="rgb(43 29 20 / 0.14)"
              />
            </ReactFlow>
          )}
        </div>
        <footer className="org-legend-bar">
          <span className="org-legend-item"><i className="org-legend-ministry" />Ministère</span>
          <span className="org-legend-item"><i className="org-legend-direction" />Direction</span>
          <span className="org-legend-item"><i className="org-legend-service" />Service</span>
          <span className="org-legend-note">
            {structureQuery
              ? `${visibleGroups.reduce((count, group) => count + group.services.length, 0)} résultat(s) sur ${totalServices} services`
              : unassignedAgents > 0
                ? `${unassignedAgents} ${unassignedAgents > 1 ? 'agents sans service renseigné' : 'agent sans service renseigné'}`
                : `${totalServices} services affichés`}
          </span>
        </footer>
      </section>

      {selectedService && (
        <OrgAgentsDialog
          eyebrow="Effectif du service"
          title={selectedService.nom}
          subtitle={[
            selectedService.direction && typeof selectedService.direction === 'string'
              ? selectedService.direction
              : selectedService.direction?.nom,
            `${serviceAgents.length} ${serviceAgents.length === 1 ? 'agent' : 'agents'}`,
          ].filter(Boolean).join(' · ')}
          agents={serviceAgents}
          serviceNames={serviceNames}
          showManagerTag
          onClose={closeServiceDialog}
          onAgentClick={openAgent}
        />
      )}

      {selectedDirection && (
        <OrgAgentsDialog
          eyebrow="Effectif de la direction"
          title={selectedDirection.name}
          subtitle={`${selectedDirection.allAgents.length} ${selectedDirection.allAgents.length === 1 ? 'agent' : 'agents'} · ${selectedDirection.services.length} ${selectedDirection.services.length === 1 ? 'service' : 'services'}. Choisissez un service pour restreindre la liste.`}
          agents={selectedDirection.allAgents}
          services={selectedDirection.services}
          serviceNames={serviceNames}
          onClose={closeDirectionDialog}
          onAgentClick={openAgent}
        />
      )}
    </section>
  );
}
