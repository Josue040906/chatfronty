import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Search,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getAgents } from '../../api/agents';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
} from '../../components/ui';
import useMediaQuery from '../../hooks/useMediaQuery';
import {
  getEmployeePhotoUrl,
  getEmployeeInitials,
} from '../../utils/employee';
import CreateAgentModal from './CreateAgentModal';

function formatName(agent) {
  return `${agent.prenom || ''} ${agent.nom || ''}`.trim();
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR').format(date);
}

function AgentAvatar({ agent, size }) {
  return (
    <Avatar
      size={size}
      src={getEmployeePhotoUrl(agent.photo)}
      initials={getEmployeeInitials(agent)}
      alt={`Photo de ${formatName(agent)}`}
    />
  );
}

function AgentSummary({ agent, onOpenProfile, onOpenCareer }) {
  if (!agent) {
    return (
      <EmptyState icon={UserRound} title="Aucun agent sélectionné">
        Choisissez un agent dans la liste pour voir son résumé sans quitter
        la page.
      </EmptyState>
    );
  }

  return (
    <div className="agt-summary-body" key={agent.id}>
      <AgentAvatar agent={agent} size="lg" />

      <h2 className="agt-summary-name">{formatName(agent)}</h2>

      <p className="agt-summary-identity">
        <span className="agt-matricule">{agent.matricule || '—'}</span>
        {agent.poste ? (
          <span className="agt-summary-poste">{agent.poste}</span>
        ) : null}
      </p>

      <dl className="agt-summary-list">
        <div>
          <dt>Service</dt>
          <dd>{agent.service || '—'}</dd>
        </div>
        <div>
          <dt>Direction</dt>
          <dd>{agent.direction || '—'}</dd>
        </div>
        <div>
          <dt>Embauche</dt>
          <dd>{formatDate(agent.date_embauche)}</dd>
        </div>
      </dl>

      <div className="agt-summary-actions">
        <Button icon={UserRound} onClick={onOpenProfile}>
          Voir le profil
        </Button>
        <Button variant="secondary" icon={BarChart3} onClick={onOpenCareer}>
          Analyser la carrière
        </Button>
      </div>
    </div>
  );
}

export default function AgentsPage({ user }) {
  const navigate = useNavigate();
  const showSummary = useMediaQuery('(min-width: 1101px)');
  const canCreateAgent = ['SPERS_AGENT', 'SPERS_CHEF'].includes(user?.role);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createFeedback, setCreateFeedback] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAgents() {
      setLoading(true);
      setError('');

      try {
        const result = await getAgents();

        if (!cancelled) {
          setAgents(result);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            'Impossible de charger la liste des agents.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAgents();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAgents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return agents;
    }

    return agents.filter((agent) => {
      const searchableText = [
        agent.matricule,
        agent.nom,
        agent.prenom,
        agent.poste,
        agent.code_service,
        agent.service,
        agent.direction,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [agents, search]);

  const selectedAgent = filteredAgents.find(
    (agent) => String(agent.id) === String(selectedId)
  );

  async function handleAgentCreated(feedback) {
    setCreateOpen(false);
    setCreateFeedback(feedback);

    try {
      const result = await getAgents();
      setAgents(result);
    } catch (refreshError) {
      console.error('Agent créé, mais impossible d’actualiser la liste.', refreshError);
      setCreateFeedback({
        tone: 'warning',
        message: `${feedback.message} La liste n’a pas pu être actualisée.`,
      });
    }
  }

  function openProfile(agent) {
    navigate(`/agents/${agent.id}`);
  }

  function openCareer(agent) {
    navigate(`/carrieres/${agent.id}/analyse`);
  }

  // Sur grand écran, un clic sélectionne l'agent (résumé à droite) et un
  // double clic ou « Voir le profil » ouvre sa fiche. Sur petit écran, il
  // n'y a pas de volet : un clic ouvre directement la fiche, comme avant.
  function activate(agent) {
    if (showSummary) {
      setSelectedId(agent.id);
    } else {
      openProfile(agent);
    }
  }

  if (loading) {
    return (
      <div className="agents-page" role="status" aria-busy="true">
        <span className="ui-visually-hidden">Chargement des agents...</span>

        <div className="agt-skeleton-heading" aria-hidden="true">
          <Skeleton width={190} height={26} radius="999px" />
          <Skeleton width={160} height={40} />
        </div>

        <Card as="div" className="agt-skeleton-table" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} width="100%" height={48} />
          ))}
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agents-page">
        <PageHeader eyebrow="Ressources humaines" title="Agents" />

        <Card as="div">
          <EmptyState
            role="alert"
            title="Chargement impossible"
            action={(
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            )}
          >
            {error}
          </EmptyState>
        </Card>
      </div>
    );
  }

  return (
    <div className="agents-page">
      <PageHeader
        eyebrow="Ressources humaines"
        title="Agents"
        subtitle="Consultez les agents enregistrés et accédez à leur profil professionnel."
      >
        <div className="agt-heading-aside">
          <div className="agt-count">
            <Users size={19} strokeWidth={1.75} aria-hidden="true" />
            <div>
              <strong>{agents.length}</strong>
              <span>agents enregistrés</span>
            </div>
          </div>

          {canCreateAgent && (
            <Button
              icon={UserPlus}
              onClick={() => {
                setCreateFeedback(null);
                setCreateOpen(true);
              }}
            >
              Ajouter un agent
            </Button>
          )}
        </div>
      </PageHeader>

      {createFeedback && (
        <div
          className={`agents-create-feedback agents-create-feedback-${createFeedback.tone}`}
          role={createFeedback.tone === 'success' ? 'status' : 'alert'}
        >
          {createFeedback.message}
          <button
            type="button"
            onClick={() => setCreateFeedback(null)}
            aria-label="Fermer le message"
          >
            ×
          </button>
        </div>
      )}

      <div className={`agt-layout${showSummary ? ' agt-layout-with-summary' : ''}`}>
        <div className="agt-list">
          <section className="agt-toolbar">
            <label className="agt-search">
              <Search size={17} strokeWidth={1.75} aria-hidden="true" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par nom, matricule, poste ou service..."
                aria-label="Rechercher un agent"
              />
            </label>

            <div className="agt-result-count" aria-live="polite">
              {filteredAgents.length} résultat
              {filteredAgents.length > 1 ? 's' : ''}
            </div>
          </section>

          <Card as="section">
            {filteredAgents.length === 0 ? (
              <EmptyState icon={Search} title="Aucun agent trouvé">
                Aucun agent ne correspond à votre recherche.
              </EmptyState>
            ) : (
              <div className="agt-table-wrapper">
                <table className="agt-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Matricule</th>
                      <th>Poste</th>
                      <th>Service</th>
                      <th>Direction</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAgents.map((agent) => {
                      const isSelected = selectedAgent?.id === agent.id;

                      return (
                        <tr
                          key={agent.id}
                          tabIndex={0}
                          className={isSelected ? 'is-selected' : ''}
                          aria-current={isSelected ? 'true' : undefined}
                          onClick={() => activate(agent)}
                          onDoubleClick={() => openProfile(agent)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              openProfile(agent);
                            } else if (event.key === ' ') {
                              event.preventDefault();
                              activate(agent);
                            }
                          }}
                        >
                          <td>
                            <div className="agt-person">
                              <AgentAvatar agent={agent} size="md" />

                              <div>
                                <strong>{formatName(agent)}</strong>
                                <span>{agent.code_service || '—'}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="agt-matricule">
                              {agent.matricule || '—'}
                            </span>
                          </td>

                          <td>{agent.poste || '—'}</td>
                          <td>{agent.service || '—'}</td>
                          <td>{agent.direction || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {showSummary ? (
          <aside className="agt-summary" aria-label="Résumé de l'agent">
            <Card as="div" className="agt-summary-card">
              <AgentSummary
                agent={selectedAgent}
                onOpenProfile={() => openProfile(selectedAgent)}
                onOpenCareer={() => openCareer(selectedAgent)}
              />
            </Card>
          </aside>
        ) : null}
      </div>

      {createOpen && canCreateAgent && (
        <CreateAgentModal
          acteurId={user?.userId}
          onClose={() => setCreateOpen(false)}
          onCreated={handleAgentCreated}
        />
      )}
    </div>
  );
}
