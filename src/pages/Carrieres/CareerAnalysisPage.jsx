import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  History,
  TrendingUp,
  UserRound,
  XCircle,
} from 'lucide-react';

import { getAgentById } from '../../api/agents';
import { analyserCarriere } from '../../api/carrieres';

import {
  getEmployeePhotoUrl,
  getEmployeeInitials,
} from '../../utils/employee';

function formatName(agent) {
  return `${agent?.prenom || ''} ${agent?.nom || ''}`.trim();
}



function formatDate(value) {
  if (!value) return '—';

  const datePart = String(value).split('T')[0];

  const [year, month, day] = datePart.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatMonths(months) {
  if (months === null || months === undefined) {
    return '—';
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} mois`;
  }

  if (remainingMonths === 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  }

  return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
}

function getHistoryDate(item) {
  return formatDate(item.dateDebut);
}

function emptyCareerAnalysis(employeId) {
  return {
    employeId: Number(employeId),
    situationActuelle: null,
    situationSuivante: null,
    historique: [],
    ancienneteActuelle: {},
    ancienneteRequise: {},
    eligible: null,
    eligibiliteDeterminee: false,
    evolution: { type: 'AUCUNE' },
  };
}

export default function CareerAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [agent, setAgent] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadCareerData() {
      setLoading(true);
      setError('');

      try {
        const agentResult = await getAgentById(id);
        let analysisResult;

        try {
          analysisResult = await analyserCarriere(id);
        } catch (analysisError) {
          if (analysisError.status !== 404) {
            throw analysisError;
          }

          analysisResult = emptyCareerAnalysis(id);
        }

        if (cancelled) return;

        setAgent(agentResult);
        setAnalysis(analysisResult);
        setHistory(
          Array.isArray(analysisResult?.historique)
            ? analysisResult.historique
            : []
        );
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Impossible de charger l'analyse de carrière."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCareerData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="career-analysis-page">
        <div className="career-analysis-loading">
          Chargement de l'analyse de carrière...
        </div>
      </div>
    );
  }

  if (error || !agent || !analysis) {
    return (
      <div className="career-analysis-page">
        <button
          type="button"
          className="career-back-button"
          onClick={() => navigate(`/agents/${id}`)}
        >
          <ArrowLeft size={17} />
          Retour au profil
        </button>

        <div className="career-analysis-error">
          <XCircle size={24} />

          <div>
            <h1>Analyse indisponible</h1>
            <p>
              {error ||
                "Les données nécessaires à l'analyse ne sont pas disponibles."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const situation = analysis.situationActuelle || {};
  const seniority = analysis.ancienneteActuelle || {};
  const condition = analysis.ancienneteRequise || {};
  const evolution = analysis.evolution || {};
  const nextSituation = analysis.situationSuivante;
  const agentName = formatName(agent);
  const photoUrl = getEmployeePhotoUrl(agent.photo);
  const profileDetails = [
    {
      label: 'Adresse',
      value: agent.adresse || '—',
    },
    {
      label: 'Téléphone',
      value: agent.telephone || '—',
    },
    {
      label: 'Email',
      value: agent.email || '—',
    },
    {
      label: 'Date de naissance',
      value: formatDate(agent.date_naissance),
    },
    {
      label: 'Lieu de naissance',
      value: agent.lieu_naissance || '—',
    },
    {
      label: 'Date d’embauche',
      value: formatDate(agent.date_embauche),
    },
    {
      label: 'Service',
      value: agent.service || '—',
    },
    {
      label: 'Direction',
      value: agent.direction || '—',
    },
  ];

  return (
    <div className="career-analysis-page">
      <button
        type="button"
        className="career-back-button"
        onClick={() => navigate(`/agents/${id}`)}
      >
        <ArrowLeft size={17} />
        Retour au profil
      </button>

      <section className="career-analysis-hero">
        <div className="career-analysis-identity">
        <div className="career-analysis-avatar">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={agentName ? `Photo de ${agentName}` : "Photo de l'agent"}
            />
          ) : (
            getEmployeeInitials(agent)
          )}
        </div>

          <div>
            <p className="page-eyebrow">
              ANALYSE DE CARRIÈRE
            </p>

            <h1>{formatName(agent)}</h1>

            <div className="career-analysis-meta">
              <span>
                <BriefcaseBusiness size={15} />
                {agent.poste || 'Poste non renseigné'}
              </span>

              <span>
                <FileText size={15} />
                {agent.matricule || '—'}
              </span>
            </div>
          </div>
        </div>

        {analysis.situationActuelle ? (
          <div className="career-availability available">
            <CheckCircle2 size={16} />
            Situation disponible
          </div>
        ) : (
          <div className="career-availability unavailable">
            <XCircle size={16} />
            Situation indisponible
          </div>
        )}
      </section>

      {!analysis.situationActuelle && (
        <section className="career-empty-analysis">
          <div className="career-empty-icon">
            <History size={24} />
          </div>

          <h2>Aucune situation de carrière enregistrée</h2>

          <p>Aucune situation de carrière actuelle n’est enregistrée pour cet agent.</p>

        </section>
      )}
      <>
          <section className="career-panel">
            <div className="career-panel-header">
              <div className="career-panel-icon">
                <UserRound size={19} />
              </div>

              <div>
                <h2>Profil du collaborateur</h2>
                <p>
                  Informations personnelles et professionnelles synchronisées depuis le backend.
                </p>
              </div>
            </div>

            <div className="career-profile-grid">
              {profileDetails.map((detail) => (
                <div key={detail.label} className="career-profile-item">
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="career-section">
            <div className="career-section-heading">
              <div>
                <p className="page-eyebrow">
                  SITUATION ACTUELLE
                </p>
                <h2>Situation professionnelle</h2>
              </div>
            </div>

            <div className="career-current-grid">
              <div className="career-current-card">
                <div className="career-current-icon">
                  <UserRound size={19} />
                </div>

                <span>Catégorie</span>
                <strong>{agent.categorie || '—'}</strong>
              </div>

              <div className="career-current-card">
                <div className="career-current-icon">
                  <BriefcaseBusiness size={19} />
                </div>

                <span>Corps</span>
                <strong>{agent.corps_libelle || agent.corps || '—'}</strong>
              </div>

              <div className="career-current-card">
                <div className="career-current-icon">
                  <TrendingUp size={19} />
                </div>

                <span>Classe</span>
                <strong>{situation.classeLibelle || '—'}</strong>
              </div>

              <div className="career-current-card">
                <div className="career-current-icon">
                  <GraduationCap size={19} />
                </div>

                <span>Échelon</span>
                <strong>{situation.echelonOrdre ?? '—'}</strong>
              </div>

              <div className="career-current-card">
                <div className="career-current-icon">
                  <CalendarDays size={19} />
                </div>

                <span>Depuis</span>
                <strong>{formatDate(situation.dateDebut)}</strong>
              </div>
            </div>
          </section>

          <section className="career-panel">
            <div className="career-panel-header">
              <div className="career-panel-icon">
                <Clock3 size={19} />
              </div>

              <div>
                <h2>Ancienneté</h2>
                <p>Calcul effectué par le backend.</p>
              </div>
            </div>

            <div className="career-seniority-value">
              {formatMonths(seniority.moisTotal)}
            </div>

            <div className="career-seniority-details">
              <div>
                <span>Depuis</span>
                <strong>{formatDate(seniority.dateDebut)}</strong>
              </div>

              <div>
                <span>Calcul au</span>
                <strong>{formatDate(seniority.dateCalcul)}</strong>
              </div>

              <div>
                <span>Condition requise</span>
                <strong>
                  {condition.dureeMinMois == null
                    ? 'Non renseignée'
                    : `${condition.dureeMinMois} mois`}
                </strong>
              </div>
            </div>

            <div
              className={`career-condition ${
                analysis.eligible === true
                  ? 'satisfied'
                  : analysis.eligible === false
                    ? 'not-satisfied'
                    : 'undetermined'
              }`}
            >
              {analysis.eligible === true ? (
                <CheckCircle2 size={18} />
              ) : (
                <XCircle size={18} />
              )}

              <strong>
                {analysis.eligible === true
                  ? 'Condition d’ancienneté satisfaite'
                  : analysis.eligible === false
                    ? 'Condition d’ancienneté non satisfaite'
                    : 'Éligibilité non déterminée'}
              </strong>
            </div>
          </section>

          <section className="career-panel career-next-step">
            <div className="career-panel-header">
              <div className="career-panel-icon">
                <TrendingUp size={19} />
              </div>

              <div>
                <h2>Évolution possible</h2>
                <p>
                  Résultat produit par l'analyse actuelle.
                </p>
              </div>
            </div>

            {evolution.type === 'ECHELON' && nextSituation ? (
              <div className="career-next-result">
                <CheckCircle2 size={20} />

                <div>
                  <span>Évolution d’échelon</span>
                  <strong>
                    {situation.classeLibelle} — échelon {situation.echelonOrdre}
                    {' → échelon '}
                    {nextSituation.echelonOrdre}
                  </strong>
                </div>
              </div>
            ) : evolution.type === 'CLASSE' && nextSituation ? (
              <div className="career-next-result">
                <CheckCircle2 size={20} />

                <div>
                  <span>Évolution de classe</span>
                  <strong>
                    {situation.classeLibelle}
                    {' → '}
                    {nextSituation.classeLibelle}
                  </strong>
                  <p>
                    Échelon {situation.echelonOrdre}
                    {' → '}
                    échelon {nextSituation.echelonOrdre}
                  </p>
                </div>
              </div>
            ) : (
              <div className="career-next-result neutral">
                <XCircle size={20} />

                <div>
                  <span>Évolution identifiée</span>
                  <strong>
                    Aucune évolution suivante identifiée.
                  </strong>
                </div>
              </div>
            )}

            <div className="career-evolution-condition">
              <span>
                Condition :{' '}
                {condition.dureeMinMois == null
                  ? 'durée minimale non renseignée'
                  : `${condition.dureeMinMois} mois d’ancienneté`}
              </span>
              <strong>
                {analysis.eligible === true
                  ? 'Condition satisfaite'
                  : analysis.eligible === false
                    ? 'Condition non satisfaite'
                    : 'Condition non déterminée'}
              </strong>
            </div>
          </section>

          <section className="career-panel">
            <div className="career-panel-header">
              <div className="career-panel-icon">
                <History size={19} />
              </div>

              <div>
                <h2>Historique de carrière</h2>
                <p>
                  Situations enregistrées pour cet agent.
                </p>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="career-history-empty">
                Aucun historique de carrière disponible.
              </div>
            ) : (
              <div className="career-timeline">
                {history.map((item) => (
                  <div
                    className="career-timeline-item"
                    key={item.historiqueId}
                  >
                    <div className="career-timeline-marker" />

                    <div className="career-timeline-content">
                      <div className="career-timeline-top">
                        <strong>
                          {item.classeLibelle || '—'}
                          {' · '}
                          {item.echelonOrdre ?? '—'}
                        </strong>

                        <span>
                          {getHistoryDate(item)}
                        </span>
                      </div>

                      {item.dateFin && (
                        <div className="career-timeline-details">
                          <span>Fin : {formatDate(item.dateFin)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
      </>
    </div>
  );
}