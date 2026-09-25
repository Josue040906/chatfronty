import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Search,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getAgents } from '../../api/agents';

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const datePart = String(value).split('T')[0];

  const [year, month, day] = datePart.split('-');

  if (!year || !month || !day) {
    return '—';
  }

  return `${day}/${month}/${year}`;
}

function getInitials(agent) {
  const first = agent.prenom?.charAt(0) || '';
  const last = agent.nom?.charAt(0) || '';

  return `${first}${last}`.toUpperCase();
}

export default function CarrieresPage() {
  const navigate = useNavigate();

  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAgents() {
      try {
        setLoading(true);
        setError('');

        const result = await getAgents();

        setAgents(result);
      } catch (err) {
        console.error(err);

        setError(
          'Impossible de charger les agents pour le module Carrières.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadAgents();
  }, []);

  const filteredAgents = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return agents;
    }

    return agents.filter((agent) => {
      const searchableText = [
        agent.matricule,
        agent.nom,
        agent.prenom,
        agent.poste,
        agent.service,
        agent.code_service,
        agent.direction,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(value);
    });
  }, [agents, search]);

  if (loading) {
    return (
      <section className="page-section">
        <div className="page-loading">
          Chargement des carrières...
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
    <section className="page-section carrieres-page">
      <div className="page-header carrieres-header">
        <div>
          <span className="page-eyebrow">
            SUIVI ADMINISTRATIF
          </span>

          <h1>Carrières</h1>

          <p>
            Consultez la situation de carrière et l'évolution
            administrative des agents.
          </p>
        </div>

        <div className="carrieres-total">
          <strong>{agents.length}</strong>
          <span>agents suivis</span>
        </div>
      </div>

      <div className="carrieres-toolbar">
        <div className="carrieres-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Rechercher un agent, un matricule, un poste..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Effacer la recherche"
            >
              ×
            </button>
          )}
        </div>

        <span className="carrieres-result-count">
          {filteredAgents.length} résultat
          {filteredAgents.length > 1 ? 's' : ''}
        </span>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="carrieres-empty">
          <UserRound size={28} />

          <strong>Aucun agent trouvé</strong>

          <span>
            Modifiez votre recherche pour retrouver un agent.
          </span>
        </div>
      ) : (
        <div className="carrieres-grid">
          {filteredAgents.map((agent) => (
            <article
              className="career-agent-card"
              key={agent.id}
            >
              <div className="career-agent-card-top">
                <div className="career-agent-avatar">
                  {getInitials(agent)}
                </div>

                <div className="career-agent-identity">
                  <h2>
                    {agent.prenom} {agent.nom}
                  </h2>

                  <span>{agent.matricule}</span>
                </div>
              </div>

              <div className="career-agent-main">
                <div className="career-agent-field">
                  <span>Poste</span>
                  <strong>
                    {agent.poste || 'Non renseigné'}
                  </strong>
                </div>

                <div className="career-agent-field">
                  <span>Service</span>
                  <strong>
                    {agent.service || 'Non renseigné'}
                  </strong>
                </div>

                <div className="career-agent-field">
                  <span>Direction</span>
                  <strong>
                    {agent.direction || 'Non renseignée'}
                  </strong>
                </div>

                <div className="career-agent-field career-agent-date">
                  <span>
                    <CalendarDays size={14} />
                    Date d'embauche
                  </span>

                  <strong>
                    {formatDate(agent.date_embauche)}
                  </strong>
                </div>
              </div>

              <div className="career-agent-card-footer">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/carrieres/${agent.id}/analyse`
                    )
                  }
                >
                  <span>Analyser la carrière</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}