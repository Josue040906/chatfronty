import { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  Search,
  Users,
} from 'lucide-react';

import { getAgents } from '../../api/agents';

function formatName(agent) {
  return `${agent.prenom || ''} ${agent.nom || ''}`.trim();
}

function getInitials(agent) {
  return `${agent.prenom?.charAt(0) || ''}${agent.nom?.charAt(0) || ''}`;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

        <div className="agents-heading-stat">
          <Users size={19} />
          <div>
            <strong>{agents.length}</strong>
            <span>agents enregistrés</span>
          </div>
        </div>
      </section>

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
                      window.location.href = `/agents/${agent.id}`;
                    }}
                  >
                    <td>
                      <div className="agent-table-person">
                        <div className="agent-table-avatar">
                          {getInitials(agent)}
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
    </div>
  );
}