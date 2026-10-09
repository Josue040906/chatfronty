import {
  getEmployeePhotoUrl,
  getEmployeeInitials,
} from '../../utils/employee';

import { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  UserPlus,
  Search,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getAgents } from '../../api/agents';
import CreateAgentModal from './CreateAgentModal';

function formatName(agent) {
  return `${agent.prenom || ''} ${agent.nom || ''}`.trim();
}


export default function AgentsPage({ user }) {
  const navigate = useNavigate();
  const canCreateAgent = ['SPERS_AGENT', 'SPERS_CHEF'].includes(user?.role);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createFeedback, setCreateFeedback] = useState(null);

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

  if (loading) {
    return (
      <div className="agents-page">
        <div className="agents-loading">
          Chargement des agents...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agents-page">
        <div className="agents-error">
          <h1>Agents</h1>
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
    <div className="agents-page">
      <section className="agents-heading">
        <div>
          <p className="page-eyebrow">
            RESSOURCES HUMAINES
          </p>

          <h1>Agents</h1>

          <p>
            Consultez les agents enregistrés et accédez
            à leur profil professionnel.
          </p>
        </div>

        <div className="agents-heading-actions">
          {canCreateAgent && (
            <button
              type="button"
              className="agents-create-button"
              onClick={() => {
                setCreateFeedback(null);
                setCreateOpen(true);
              }}
            >
              <UserPlus size={17} />
              Ajouter un agent
            </button>
          )}

          <div className="agents-heading-stat">
            <Users size={19} />
            <div>
              <strong>{agents.length}</strong>
              <span>agents enregistrés</span>
            </div>
          </div>
        </div>
      </section>

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

      <section className="agents-toolbar">
        <div className="agents-search">
          <Search size={17} />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par nom, matricule, poste ou service..."
            aria-label="Rechercher un agent"
          />
        </div>

        <div className="agents-result-count">
          {filteredAgents.length} résultat
          {filteredAgents.length > 1 ? 's' : ''}
        </div>
      </section>

      <section className="agents-card">
        {filteredAgents.length === 0 ? (
          <div className="agents-empty">
            <div className="agents-empty-icon">
              <Search size={20} />
            </div>

            <h2>Aucun agent trouvé</h2>

            <p>
              Aucun agent ne correspond à votre recherche.
            </p>
          </div>
        ) : (
          <div className="agents-table-wrapper">
            <table className="agents-table">
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
                {filteredAgents.map((agent) => (
                  <tr
                    key={agent.id}
                    onClick={() => {
                      navigate(`/agents/${agent.id}`);
                    }}
                  >
                    <td>
                      <div className="agent-table-person">
                        <div className="agent-table-avatar">
                          {getEmployeePhotoUrl(agent.photo) ? (
                            <img
                              src={getEmployeePhotoUrl(agent.photo)}
                              alt={`Photo de ${formatName(agent)}`}
                            />
                          ) : (
                            getEmployeeInitials(agent)
                          )}
                        </div>

                        <div>
                          <strong>{formatName(agent)}</strong>
                          <span>{agent.code_service || '—'}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="agent-matricule">
                        {agent.matricule || '—'}
                      </span>
                    </td>

                    <td>
                      <div className="agent-table-poste">
                        <BriefcaseBusiness size={15} />
                        <span>{agent.poste || '—'}</span>
                      </div>
                    </td>

                    <td>
                      <span className="agent-table-service">
                        {agent.service || '—'}
                      </span>
                    </td>

                    <td>
                      <span className="agent-table-direction">
                        {agent.direction || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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