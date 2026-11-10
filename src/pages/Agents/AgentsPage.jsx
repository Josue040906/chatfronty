import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getAgents, searchAgentIds } from '../../api/agents';
import { Skeleton } from '../../components/ui';
import useMediaQuery from '../../hooks/useMediaQuery';
import useUrlFilter from '../../hooks/useUrlFilter';
import {
  getEmployeePhotoUrl,
  getEmployeeInitials,
} from '../../utils/employee';
import PersonPhoto from '../../components/agents/PersonPhoto';
import CreateAgentModal from './CreateAgentModal';

function formatName(agent) {
  return `${agent.prenom || ''} ${agent.nom || ''}`.trim();
}

function formatDateLong(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

const DOSSIER_FILTERS = ['incomplet'];

export default function AgentsPage({ user }) {
  const navigate = useNavigate();
  const showSummary = useMediaQuery('(min-width: 1101px)');
  const canCreateAgent = ['SPERS_AGENT', 'SPERS_CHEF'].includes(user?.role);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  // « incomplet » : seulement les dossiers que l'API juge incomplets.
  const [dossierFilter, setDossierFilter] = useUrlFilter('dossier', DOSSIER_FILTERS, '');
  // « recherche » : les critères d'un filtrage de Bandy, relancés auprès de l'API.
  const [recherche, setRecherche] = useUrlFilter('recherche', null, '');
  const [selection, setSelection] = useState({ recherche: '', ids: null, failed: false });
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

  useEffect(() => {
    if (!recherche) {
      return undefined;
    }
    let cancelled = false;
    searchAgentIds(recherche)
      .then((ids) => !cancelled && setSelection({ recherche, ids: new Set(ids), failed: false }))
      .catch(() => !cancelled && setSelection({ recherche, ids: new Set(), failed: true }));
    return () => {
      cancelled = true;
    };
  }, [recherche]);

  const selectionReady = !recherche || selection.recherche === recherche;
  const selectedIds = recherche && selectionReady ? selection.ids : null;

  const incompleteCount = useMemo(
    () => agents.filter((agent) => agent.dossier_complet === false).length,
    [agents]
  );

  const filteredAgents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const listedAgents = agents
      .filter((agent) => !selectedIds || selectedIds.has(String(agent.id)))
      .filter((agent) => dossierFilter !== 'incomplet' || agent.dossier_complet === false);

    if (!normalizedSearch) {
      return listedAgents;
    }

    return listedAgents.filter((agent) => {
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
  }, [agents, dossierFilter, search, selectedIds]);

  // Recherche, dossier ou sélection de Bandy : un clic ramène à la liste complète.
  const filtered = Boolean(search.trim() || dossierFilter || recherche);
  function resetFilters() {
    setSearch('');
    // Une seule navigation retire tous les filtres de l'adresse (dossier, recherche).
    navigate({ search: '' }, { replace: true });
  }

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

  if (loading || !selectionReady) {
    return (
      <div className="rf-page agents-screen" role="status" aria-busy="true">
        <span className="ui-visually-hidden">Chargement des agents...</span>
        <div className="rf-list" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} width="100%" height={74} radius="24px" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rf-page agents-screen">
        <header className="rf-head">
          <div>
            <p className="rf-eyebrow">Ressources humaines</p>
            <h1 className="rf-title">Agents</h1>
          </div>
        </header>
        <div className="rf-card agents-empty" role="alert">
          <h2>Chargement impossible</h2>
          <p>{error}</p>
          <button
            type="button"
            className="rf-btn rf-btn-primary"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rf-page agents-screen">
      <header className="rf-head">
        <div>
          <p className="rf-eyebrow">Ressources humaines</p>
          <h1 className="rf-title">Agents</h1>
          <p className="rf-lead">
            Consultez les agents enregistrés et accédez à leur profil professionnel.
          </p>
        </div>

        {canCreateAgent && (
          <button
            type="button"
            className="rf-btn rf-btn-primary"
            onClick={() => {
              setCreateFeedback(null);
              setCreateOpen(true);
            }}
          >
            <UserPlus size={18} />
            Ajouter un agent
          </button>
        )}
      </header>

      {recherche && selection.failed && (
        <p className="rf-error" role="alert">
          La sélection de Bandy n’a pas pu être relancée. Retirez-la pour revoir tous les agents.
        </p>
      )}

      {createFeedback && (
        <p
          className={createFeedback.tone === 'success' ? 'rf-success' : 'rf-error'}
          role={createFeedback.tone === 'success' ? 'status' : 'alert'}
        >
          {createFeedback.message}
          <button
            type="button"
            className="agents-feedback-close"
            onClick={() => setCreateFeedback(null)}
            aria-label="Fermer le message"
          >
            ×
          </button>
        </p>
      )}

      <div className="rf-toolbar">
        <label className="rf-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par nom, matricule, poste ou service..."
            aria-label="Rechercher un agent"
          />
        </label>
        <div className="rf-chips" role="group" aria-label="Dossiers">
          <button
            type="button"
            className="rf-chip"
            aria-pressed={dossierFilter === ''}
            onClick={() => setDossierFilter('')}
          >
            Tous
            <span>{agents.length}</span>
          </button>
          <button
            type="button"
            className="rf-chip"
            aria-pressed={dossierFilter === 'incomplet'}
            onClick={() => setDossierFilter('incomplet')}
          >
            Dossiers incomplets
            <span>{incompleteCount}</span>
          </button>
        </div>
        {recherche && (
          <button
            type="button"
            className="rf-chip"
            aria-pressed="true"
            title="Retirer la sélection de Bandy"
            onClick={() => setRecherche('')}
          >
            Sélection de Bandy
            <span>{selectedIds?.size ?? 0}</span>
            <X size={14} aria-hidden="true" />
          </button>
        )}
        <span className="agents-count" aria-live="polite">
          {filteredAgents.length} agent{filteredAgents.length > 1 ? 's' : ''}
          {filtered ? ` sur ${agents.length}` : ''}
        </span>
        {filtered && (
          <button type="button" className="rf-btn agents-reset" onClick={resetFilters}>
            Réinitialiser
          </button>
        )}
      </div>

      <div className="agents-layout">
        <section aria-label="Liste des agents" className="agents-main">
          {filteredAgents.length === 0 ? (
            <div className="rf-card agents-empty">
              <h2>Aucun agent trouvé</h2>
              <p>Aucun agent ne correspond à votre recherche.</p>
              {filtered && (
                <button type="button" className="rf-btn" onClick={resetFilters}>
                  Revoir tous les agents
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="agents-columns" aria-hidden="true">
                <span>Agent</span>
                <span>Matricule</span>
                <span>Poste</span>
                <span>Service</span>
              </div>

              <div className="rf-list">
                {filteredAgents.map((agent, index) => {
                  const isSelected = selectedAgent?.id === agent.id;
                  const photoUrl = getEmployeePhotoUrl(agent.photo);

                  return (
                    <div
                      key={agent.id}
                      role="button"
                      tabIndex={0}
                      className={`rf-row agents-row${isSelected ? ' is-selected' : ''}`}
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
                      <span className="agents-row-person">
                        <span className={`rf-avatar rf-avatar-lg rf-avatar-tone-${index % 5}`}>
                          <PersonPhoto
                            src={photoUrl}
                            alt={`Photo de ${formatName(agent)}`}
                            initials={getEmployeeInitials(agent)}
                          />
                        </span>
                        <strong>{formatName(agent)}</strong>
                      </span>
                      <span className="rf-mono agents-row-matricule">
                        {agent.matricule || '—'}
                      </span>
                      <span className="agents-row-poste">
                        {agent.poste || 'Poste non renseigné'}
                      </span>
                      <span className="agents-row-service">{agent.service || '—'}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {showSummary ? (
          <aside
            className="rf-card rf-aside agents-aside"
            aria-label="Résumé de l'agent"
          >
            {selectedAgent ? (
              <div key={selectedAgent.id} className="agents-aside-body">
                <div className="agents-aside-avatar">
                  <PersonPhoto
                    src={getEmployeePhotoUrl(selectedAgent.photo)}
                    alt={`Photo de ${formatName(selectedAgent)}`}
                    initials={getEmployeeInitials(selectedAgent)}
                  />
                </div>
                <h2>{formatName(selectedAgent)}</h2>
                <p className="rf-mono agents-aside-matricule">
                  {selectedAgent.matricule || '—'}
                </p>
                <dl className="rf-dl agents-aside-list">
                  <div>
                    <dt>Service</dt>
                    <dd>{selectedAgent.service || '—'}</dd>
                  </div>
                  <div>
                    <dt>Direction</dt>
                    <dd>{selectedAgent.direction || '—'}</dd>
                  </div>
                  <div>
                    <dt>Embauche</dt>
                    <dd>{formatDateLong(selectedAgent.date_embauche)}</dd>
                  </div>
                </dl>
                <div className="agents-aside-actions">
                  <button
                    type="button"
                    className="rf-btn rf-btn-primary"
                    onClick={() => openProfile(selectedAgent)}
                  >
                    Voir le profil
                  </button>
                  <button
                    type="button"
                    className="rf-btn"
                    onClick={() => openCareer(selectedAgent)}
                  >
                    Analyser la carrière
                  </button>
                </div>
              </div>
            ) : (
              <div className="agents-aside-empty">
                <UserRound size={32} />
                <h2>Aucun agent sélectionné</h2>
                <p>
                  Choisissez un agent dans la liste pour voir son résumé sans
                  quitter la page.
                </p>
              </div>
            )}
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
