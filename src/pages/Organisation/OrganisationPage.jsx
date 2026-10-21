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
  ArrowDownUp,
  Building2,
  ChevronRight,
  CircleHelp,
  Landmark,
  Maximize,
  Minus,
  Search,
  Users,
  X,
  ZoomIn,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getOrganisationData } from '../../api/organisation';
import EmployeePhoto from '../../components/EmployeePhoto';
import {
  getEmployeeInitials,
  getEmployeePhotoUrl,
} from '../../utils/employee';

const MINISTRY_NAME = 'Ministère de l’Économie et des Finances';
const DIRECTION_WIDTH = 300;
const DIRECTION_HEIGHT = 155;
const SERVICE_WIDTH = 284;
const SERVICE_HEIGHT = 126;
const SERVICE_GAP = 22;
const SERVICE_COLUMN_GAP = 90;
const GROUP_COLUMN_GAP = 120;
const DIRECTION_SERVICE_GAP = 60;
const DIRECTION_X = 70;
const MINISTRY_WIDTH = 390;

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

function MinistryNode() {
  return (
    <div className="org-ministry-node">
      <InvisibleHandles />
      <div className="org-ministry-mark" aria-hidden="true">
        <Landmark size={25} strokeWidth={1.8} />
      </div>
      <div className="org-ministry-copy">
        <span>RÉPUBLIQUE DE MADAGASCAR</span>
        <strong>{MINISTRY_NAME}</strong>
        <small>Structure administrative</small>
      </div>
      <div className="org-ministry-indicator" aria-hidden="true" />
    </div>
  );
}

function DirectionNode({ data }) {
  return (
    <div className="org-direction-node">
      <InvisibleHandles />
      <div className="org-node-eyebrow">
        <span className="org-node-icon org-node-icon-direction">
          <Building2 size={17} />
        </span>
        <span>Direction</span>
      </div>
      <strong className="org-direction-name">{data.name}</strong>
      <div className="org-direction-meta">
        <span>
          <Building2 size={13} />
          {data.serviceCount} {data.serviceCount === 1 ? 'service' : 'services'}
        </span>
        <span>
          <Users size={13} />
          {data.agentCount} {data.agentCount === 1 ? 'agent' : 'agents'}
        </span>
      </div>
      <div className={`org-leader ${data.leader ? '' : 'org-leader-empty'}`}>
        <span className="org-leader-dot" aria-hidden="true" />
        <span className="org-leader-copy">
          <small>Directeur</small>
          <strong>{data.leader || 'Non renseigné'}</strong>
        </span>
      </div>
    </div>
  );
}

function ServiceNode({ data }) {
  return (
    <div className="org-service-node-wrap">
      <InvisibleHandles />
      <button
        type="button"
        className={`org-service-node nodrag nopan ${data.isSelected ? 'is-selected' : ''}`}
        onClick={() => data.onSelect(data.service)}
        aria-label={`Ouvrir le service ${data.service.nom} et consulter ${data.agentCount} agents`}
      >
        <span className="org-service-icon" aria-hidden="true">
          <Users size={17} />
        </span>
        <span className="org-service-copy">
            <span className="org-node-eyebrow">
              {data.hasDirection === false
                ? 'RATTACHEMENT NON RENSEIGNÉ'
                : `SERVICE ${getServiceCode(data.service)}`}
            </span>
          <strong>{data.service.nom}</strong>
          <span className="org-service-leader">
            {data.leader ? `Chef : ${data.leader}` : 'Responsable non renseigné'}
          </span>
        </span>
        <span className="org-service-count">
          <strong>{data.agentCount}</strong>
          <small>{data.agentCount === 1 ? 'agent' : 'agents'}</small>
        </span>
        <ChevronRight className="org-service-arrow" size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

const nodeTypes = {
  ministry: MinistryNode,
  direction: DirectionNode,
  service: ServiceNode,
};

function ServiceAgentsDialog({ service, agents, onClose, onAgentClick }) {
  const [query, setQuery] = useState('');
  const closeButtonRef = useRef(null);
  const manager = agents.find(isServiceManager);
  const managerName = manager ? getAgentName(manager) : '';

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

  const filteredAgents = useMemo(() => {
    const search = normalized(query);
    if (!search) return agents;
    return agents.filter((agent) =>
      normalized([
        agent.matricule,
        agent.nom,
        agent.prenom,
      ].join(' ')).includes(search)
    );
  }, [agents, query]);

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
          <div className="org-dialog-heading">
            <div className="org-dialog-title-group">
              <span className="org-dialog-icon"><Users size={20} /></span>
              <div>
                <span className="org-dialog-eyebrow">EFFECTIF DU SERVICE</span>
                <h2 id="org-dialog-title">{service.nom}</h2>
                {service.code && <p>Code service · {service.code}</p>}
              </div>
            </div>
            <div className="org-dialog-manager">
              <span className="org-dialog-manager-avatar" aria-hidden="true">
                {getEmployeeInitials(manager) || '?'}
                {getEmployeePhotoUrl(manager?.photo) && (
                  <EmployeePhoto
                    src={getEmployeePhotoUrl(manager.photo)}
                    alt=""
                  />
                )}
              </span>
              <span className="org-dialog-manager-copy">
                <small>Chef de service</small>
                <strong>{managerName || 'Non renseigné'}</strong>
              </span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="org-dialog-close"
            onClick={onClose}
            aria-label="Fermer la liste des agents"
          >
            <X size={19} />
          </button>
        </header>

        <div className="org-dialog-summary">
          <span className="org-dialog-count">{agents.length}</span>
          <span>{agents.length === 1 ? 'agent rattaché' : 'agents rattachés'}</span>
          <span className="org-dialog-hint">Sélectionnez une carte pour ouvrir le profil</span>
        </div>

        <label className="org-agent-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par nom ou matricule"
            aria-label="Rechercher un agent par nom ou matricule"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche">
              <X size={15} />
            </button>
          )}
        </label>

        <div className="org-agent-list" aria-live="polite">
          {filteredAgents.length > 0 ? filteredAgents.map((agent) => (
            <button
              className="org-agent-card"
              type="button"
              key={agent.id}
              onClick={() => onAgentClick(agent.id)}
              aria-label={`Ouvrir le profil de ${getAgentName(agent) || 'cet agent'}`}
            >
              <span className="org-agent-avatar" aria-hidden="true">
                {getEmployeeInitials(agent) || '?'}
                {getEmployeePhotoUrl(agent.photo) && (
                  <EmployeePhoto
                    src={getEmployeePhotoUrl(agent.photo)}
                    alt=""
                  />
                )}
              </span>
              <span className="org-agent-identity">
                <strong>{getAgentName(agent) || 'Nom non renseigné'}</strong>
                <small>{agent.matricule || 'Matricule non renseigné'}</small>
                <span className="org-agent-position">{agent.poste || 'Poste non renseigné'}</span>
              </span>
              <ChevronRight size={17} className="org-agent-arrow" aria-hidden="true" />
            </button>
          )) : (
            <div className="org-dialog-empty">
              <CircleHelp size={22} />
              <strong>{agents.length ? 'Aucun résultat' : 'Aucun agent rattaché'}</strong>
              <span>
                {agents.length
                  ? 'Essayez un autre nom ou matricule.'
                  : 'Aucun agent n’est actuellement associé à ce service.'}
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
      data: {},
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
            name: group.direction.name,
            serviceCount: group.services.length,
            agentCount: group.direction.agentCount,
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
          style: { stroke: '#b8874a', strokeWidth: 1.5 },
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
            style: { stroke: '#c9ad84', strokeWidth: 1.4 },
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
  }, [organisation, selectedServiceId, selectService, visibleGroups]);

  const closeServiceDialog = useCallback(() => setSelectedService(null), []);
  const openAgent = useCallback((id) => {
    setSelectedService(null);
    navigate(`/agents/${id}`);
  }, [navigate]);

  const serviceAgents = selectedService
    ? getServiceAgents(organisation.agentsByService, selectedService.code)
    : [];
  const totalAgents = data.agents.length;
  const totalDirectors = organisation.directions.length;
  const totalServices = data.services.length;
  const fitDiagram = useCallback(() => {
    flowRef.current?.fitView({ padding: 0.18, duration: 350 });
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      flowRef.current?.fitView({ padding: 0.18, duration: 280 });
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
    <section className="page-section organisation-page">
      <header className="org-page-heading">
        <div>
          <span className="org-overline">MINISTÈRE DE L’ÉCONOMIE ET DES FINANCES</span>
          <h1>Organigramme</h1>
          <p>Explorez les directions, les services et leurs effectifs.</p>
        </div>
        <div className="org-heading-note">
          <span className="org-live-dot" />
          <span>Structure actuelle</span>
        </div>
      </header>

      <div className="org-overview" aria-label="Indicateurs de la structure">
        <div className="org-overview-card">
          <span className="org-overview-icon org-overview-icon-blue"><Building2 size={18} /></span>
          <span><strong>{totalDirectors}</strong><small>Directions</small></span>
        </div>
        <div className="org-overview-card">
          <span className="org-overview-icon org-overview-icon-teal"><Landmark size={18} /></span>
          <span><strong>{totalServices}</strong><small>Services</small></span>
        </div>
        <div className="org-overview-card">
          <span className="org-overview-icon org-overview-icon-slate"><Users size={18} /></span>
          <span><strong>{totalAgents}</strong><small>Agents référencés</small></span>
        </div>
      </div>

      <section className="org-workspace" aria-label="Organigramme interactif">
        <div className="org-workspace-heading">
          <div>
            <span className="org-overline">VUE HIÉRARCHIQUE</span>
            <h2>Structure administrative</h2>
          </div>
          <div className="org-workspace-tools">
            <label className="org-structure-search">
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
                  onClick={() => setStructureQuery('')}
                  aria-label="Effacer la recherche"
                >
                  <X size={14} />
                </button>
              )}
            </label>
            <div className="org-legend">
              <span><i className="org-legend-ministry" />Ministère</span>
              <span><i className="org-legend-direction" />Direction</span>
              <span><i className="org-legend-service" />Service interactif</span>
            </div>
          </div>
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
              <button type="button" onClick={() => setStructureQuery('')}>
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
              fitViewOptions={{ padding: 0.18, minZoom: 0.18, maxZoom: 0.9 }}
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
                gap={24}
                size={1}
                color="#e2d9cc"
              />
              <div className="org-flow-controls" aria-label="Contrôles de l’organigramme">
                <button type="button" onClick={() => flowRef.current?.zoomIn({ duration: 180 })} aria-label="Zoom avant">
                  <ZoomIn size={17} />
                </button>
                <button type="button" onClick={() => flowRef.current?.zoomOut({ duration: 180 })} aria-label="Zoom arrière">
                  <Minus size={17} />
                </button>
                <span className="org-control-divider" />
                <button type="button" onClick={fitDiagram} aria-label="Recentrer et ajuster l’organigramme">
                  <Maximize size={16} />
                </button>
              </div>
              <div className="org-flow-hint">
                <ArrowDownUp size={14} />
                Faites glisser pour explorer · Cliquez sur un service pour voir ses agents
              </div>
            </ReactFlow>
          )}
        </div>
        <footer className="org-workspace-footer">
          <span><span className="org-live-dot" /> {structureQuery
            ? `${visibleGroups.reduce((count, group) => count + group.services.length, 0)} résultat(s) sur ${totalServices} services`
            : `${totalServices} services affichés`}
          </span>
          <span>Molette ou boutons pour zoomer · Glisser pour déplacer</span>
        </footer>
      </section>

      {selectedService && (
        <ServiceAgentsDialog
          service={selectedService}
          agents={serviceAgents}
          onClose={closeServiceDialog}
          onAgentClick={openAgent}
        />
      )}
    </section>
  );
}
