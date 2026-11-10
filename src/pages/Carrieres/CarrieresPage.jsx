import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Search,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getAgents } from '../../api/agents';
import PersonPhoto from '../../components/agents/PersonPhoto';
import {
  getEmployeePhotoUrl,
  getEmployeeInitials,
} from '../../utils/employee';
import TypeEmploiBadge from '../../components/agents/TypeEmploiBadge';

const MONTHS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];
const AVATAR_TONES = ['gold', 'green', 'blue', 'red', 'sand'];

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const datePart = String(value).split('T')[0];

  const [year, month, day] = datePart.split('-');

  if (!year || !month || !day || !MONTHS[Number(month) - 1]) {
    return '—';
  }

  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
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
    <section className="page-section carrieres-page rf-page">
      <header className="rf-head">
        <div>
          <p className="rf-eyebrow">Suivi administratif</p>
          <h1 className="rf-title">Carrières</h1>
          <p className="rf-lead">
            Consultez la situation de carrière et l'évolution
            professionnelle des agents.
          </p>
        </div>
        <span className="carrieres-total">
          <strong>{agents.length}</strong> agents suivis
        </span>
      </header>

      <div className="carrieres-toolbar">
        <label className="rf-search carrieres-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="text"
            placeholder="Rechercher un agent, un matricule, un poste..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Rechercher un agent"
          />
          {search && (
            <button
              type="button"
              className="carrieres-clear"
              onClick={() => setSearch('')}
              aria-label="Effacer la recherche"
            >
              ×
            </button>
          )}
        </label>
        <span className="carrieres-result-count">
          {filteredAgents.length} résultat
          {filteredAgents.length > 1 ? 's' : ''}
        </span>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="carrieres-empty rf-card">
          <UserRound size={28} />
          <strong>Aucun agent trouvé</strong>
          <span>Modifiez votre recherche pour retrouver un agent.</span>
        </div>
      ) : (
        <div className="carrieres-grid">
          {filteredAgents.map((agent, index) => (
            <article className="rf-card career-agent-card" key={agent.id}>
              <div className="career-agent-card-top">
                <span className={`career-agent-avatar tone-${AVATAR_TONES[index % AVATAR_TONES.length]}`}>
                  <PersonPhoto
                    src={getEmployeePhotoUrl(agent.photo)}
                    alt={`${agent.prenom || ''} ${agent.nom || ''}`.trim()}
                    initials={getEmployeeInitials(agent)}
                  />
                </span>
                <div className="career-agent-identity">
                  <h2>{agent.prenom} {agent.nom}</h2>
                  <span>{agent.matricule}</span>
                  <TypeEmploiBadge type={agent.type_emploi} />
                </div>
              </div>

              <dl className="career-agent-main">
                <div>
                  <dt>Poste</dt>
                  <dd>{agent.poste || 'Non renseigné'}</dd>
                </div>
                <div>
                  <dt>Service</dt>
                  <dd>{agent.service || 'Non renseigné'}</dd>
                </div>
                <div className="career-agent-wide">
                  <dt>Direction</dt>
                  <dd>{agent.direction || 'Non renseignée'}</dd>
                </div>
                <div className="career-agent-wide">
                  <dt><CalendarDays size={14} /> Date d'embauche</dt>
                  <dd>{formatDate(agent.date_embauche)}</dd>
                </div>
              </dl>

              <button
                type="button"
                className="career-agent-link"
                onClick={() => navigate(`/carrieres/${agent.id}/analyse`)}
              >
                <span>Analyser la carrière</span>
                <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
