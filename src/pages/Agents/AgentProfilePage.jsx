import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Building2,
  IdCard,
  UserRound,
  AlertCircle,
} from 'lucide-react';

import { getAgentById } from '../../api/agents';

function formatName(agent) {
  return `${agent.prenom || ''} ${agent.nom || ''}`.trim();
}

function getInitials(agent) {
  return `${agent.prenom?.charAt(0) || ''}${agent.nom?.charAt(0) || ''}`;
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR').format(date);
}

export default function AgentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAgent() {
      setLoading(true);
      setError('');

      try {
        const result = await getAgentById(id);

        if (!cancelled) {
          setAgent(result);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Impossible de charger le profil de l'agent."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAgent();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="agent-profile-page">
        <div className="agent-profile-loading">
          Chargement du profil...
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="agent-profile-page">
        <button
          type="button"
          className="agent-profile-back"
          onClick={() => navigate('/agents')}
        >
          <ArrowLeft size={17} />
          Retour aux agents
        </button>

        <div className="agent-profile-error">
          <AlertCircle size={24} />

          <div>
            <h1>Profil introuvable</h1>
            <p>
              {error || "Cet agent n'existe pas ou n'est plus disponible."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-profile-page">
      <button
        type="button"
        className="agent-profile-back"
        onClick={() => navigate('/agents')}
      >
        <ArrowLeft size={17} />
        Retour aux agents
      </button>

      <section className="agent-profile-hero">
        <div className="agent-profile-identity">
          <div className="agent-profile-avatar">
            {getInitials(agent)}
          </div>

          <div>
            <p className="page-eyebrow">
              PROFIL AGENT
            </p>

            <h1>{formatName(agent)}</h1>

            <div className="agent-profile-meta">
              <span>
                <BriefcaseBusiness size={15} />
                {agent.poste || 'Poste non renseigné'}
              </span>

              <span>
                <IdCard size={15} />
                {agent.matricule || 'Matricule non renseigné'}
              </span>
            </div>
          </div>
        </div>

        <span className="agent-profile-status">
          Agent
        </span>
      </section>

      <div className="agent-profile-grid">
        <section className="agent-profile-card">
          <div className="agent-profile-card-header">
            <div className="agent-profile-card-icon">
              <BriefcaseBusiness size={18} />
            </div>

            <div>
              <h2>Informations professionnelles</h2>
              <p>
                Affectation et situation professionnelle actuelle.
              </p>
            </div>
          </div>

          <div className="agent-profile-details">
            <div className="agent-detail">
              <span>Matricule</span>
              <strong>{agent.matricule || '—'}</strong>
            </div>

            <div className="agent-detail">
              <span>Poste</span>
              <strong>{agent.poste || '—'}</strong>
            </div>

            <div className="agent-detail">
              <span>Service</span>
              <strong>{agent.service || agent.code_service || '—'}</strong>
            </div>

            <div className="agent-detail">
              <span>Direction</span>
              <strong>{agent.direction || '—'}</strong>
            </div>
          </div>
        </section>

        <section className="agent-profile-card">
          <div className="agent-profile-card-header">
            <div className="agent-profile-card-icon">
              <UserRound size={18} />
            </div>

            <div>
              <h2>Informations personnelles</h2>
              <p>
                Informations d'identification de l'agent.
              </p>
            </div>
          </div>

          <div className="agent-profile-details">
            <div className="agent-detail">
              <span>Nom</span>
              <strong>{agent.nom || '—'}</strong>
            </div>

            <div className="agent-detail">
              <span>Prénom</span>
              <strong>{agent.prenom || '—'}</strong>
            </div>

            <div className="agent-detail">
              <span>Date de naissance</span>
              <strong>
                {formatDate(agent.date_naissance)}
              </strong>
            </div>

            <div className="agent-detail">
              <span>Date d'embauche</span>
              <strong>
                {formatDate(agent.date_embauche)}
              </strong>
            </div>
          </div>
        </section>
      </div>

      <section className="agent-profile-card agent-career-preview">
        <div className="agent-profile-card-header">
          <div className="agent-profile-card-icon">
            <CalendarDays size={18} />
          </div>

          <div>
            <h2>Parcours professionnel</h2>
            <p>
              Analyse de la situation et évolution de carrière.
            </p>
          </div>
        </div>

        <div className="agent-career-content">
          <div className="agent-career-placeholder">
            <Building2 size={20} />

            <div>
              <strong>Analyse de carrière</strong>
              <p>
                L'analyse détaillée de la carrière de cet agent
                sera accessible ici.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="agent-career-button"
            onClick={() =>
              navigate(`/carrieres/${agent.id}/analyse`)
            }
          >
            Analyser la carrière
          </button>
        </div>
      </section>
    </div>
  );
}