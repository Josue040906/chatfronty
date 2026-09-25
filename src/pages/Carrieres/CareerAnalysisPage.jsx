import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
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
import {
  getCareerAnalysis,
  getCareerHistory,
} from '../../api/carrieres';

function formatName(agent) {
  return `${agent?.prenom || ''} ${agent?.nom || ''}`.trim();
}

function getInitials(agent) {
  return `${agent?.prenom?.charAt(0) || ''}${agent?.nom?.charAt(0) || ''}`;
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
  return formatDate(item.date_debut);
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
        const [agentResult, analysisResult, historyResult] =
          await Promise.all([
            getAgentById(id),
            getCareerAnalysis(id),
            getCareerHistory(id),
          ]);

        if (cancelled) return;

        setAgent(agentResult);
        setAnalysis(analysisResult);

        setHistory(
          Array.isArray(historyResult)
            ? historyResult
            : historyResult
              ? [historyResult]
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

  const situation = analysis.situation_actuelle;
  const rule = analysis.regle_appliquee;
  const seniority = analysis.anciennete;
  const nextClass = analysis.classe_suivante;

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
            {getInitials(agent)}
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

        {analysis.situation_disponible ? (
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

      {!analysis.situation_disponible ? (
        <section className="career-empty-analysis">
          <div className="career-empty-icon">
            <History size={24} />
          </div>

          <h2>Aucune situation de carrière enregistrée</h2>

          <p>{analysis.conclusion}</p>

          <button
            type="button"
            onClick={() => navigate(`/agents/${id}`)}
          >
            Retour au profil
          </button>
        </section>
      ) : (
        <>
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
                  <Award size={19} />
                </div>

                <span>Grade</span>
                <strong>{situation.grade || '—'}</strong>
                <small>{situation.grade_libelle || '—'}</small>
              </div>

              <div className="career-current-card">
                <div className="career-current-icon">
                  <TrendingUp size={19} />
                </div>

                <span>Classe</span>
                <strong>{situation.classe || '—'}</strong>
                <small>{situation.classe_libelle || '—'}</small>
              </div>

              <div className="career-current-card">
                <div className="career-current-icon">
                  <GraduationCap size={19} />
                </div>

                <span>Échelon</span>
                <strong>{situation.echelon || '—'}</strong>
                <small>
                  {situation.echelon_libelle || '—'}
                </small>
              </div>

              <div className="career-current-card">
                <div className="career-current-icon">
                  <TrendingUp size={19} />
                </div>

                <span>Indice</span>
                <strong>{situation.indice || '—'}</strong>
                <small>Indice actuel</small>
              </div>
            </div>

            <div className="career-information-card">
              <div className="career-information-row">
                <span>Statut</span>
                <strong>
                  {situation.statut_agent || '—'}
                </strong>
              </div>

              <div className="career-information-row">
                <span>Cadre</span>
                <strong>
                  {situation.cadre || '—'}
                  {situation.cadre_code
                    ? ` — ${situation.cadre_code}`
                    : ''}
                </strong>
              </div>

              <div className="career-information-row">
                <span>Échelle</span>
                <strong>
                  {situation.echelle || '—'}
                </strong>
              </div>

              <div className="career-information-row">
                <span>Corps</span>
                <strong>
                  {situation.corps || '—'}
                </strong>
              </div>

              <div className="career-information-row">
                <span>Depuis</span>
                <strong>
                  {formatDate(situation.date_debut)}
                </strong>
              </div>
            </div>
          </section>

          <section className="career-analysis-grid">
            <div className="career-panel">
              <div className="career-panel-header">
                <div className="career-panel-icon">
                  <Clock3 size={19} />
                </div>

                <div>
                  <h2>Ancienneté</h2>
                  <p>
                    Calcul effectué par le moteur RH.
                  </p>
                </div>
              </div>

              <div className="career-seniority-value">
                {formatMonths(seniority?.nombre_mois)}
              </div>

              <div className="career-seniority-details">
                <div>
                  <span>Depuis</span>
                  <strong>
                    {formatDate(seniority?.date_debut)}
                  </strong>
                </div>

                <div>
                  <span>Calcul au</span>
                  <strong>
                    {formatDate(seniority?.date_calcul)}
                  </strong>
                </div>

                <div>
                  <span>Condition requise</span>
                  <strong>
                    {seniority?.condition_requise_mois ?? '—'} mois
                  </strong>
                </div>
              </div>

              <div
                className={`career-condition ${
                  seniority?.condition_satisfaite
                    ? 'satisfied'
                    : 'not-satisfied'
                }`}
              >
                {seniority?.condition_satisfaite ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <XCircle size={18} />
                )}

                <strong>
                  {seniority?.condition_satisfaite
                    ? 'Condition d’ancienneté satisfaite'
                    : 'Condition d’ancienneté non satisfaite'}
                </strong>
              </div>
            </div>

            <div className="career-panel">
              <div className="career-panel-header">
                <div className="career-panel-icon">
                  <FileText size={19} />
                </div>

                <div>
                  <h2>Règle applicable</h2>
                  <p>
                    Règle identifiée par le moteur RH.
                  </p>
                </div>
              </div>

              {analysis.regle_applicable && rule ? (
                <>
                  <h3 className="career-rule-title">
                    {rule.libelle || rule.code || 'Règle RH'}
                  </h3>

                  <p className="career-rule-description">
                    {rule.description || '—'}
                  </p>

                  <div className="career-rule-meta">
                    <div>
                      <span>Type</span>
                      <strong>
                        {rule.type_regle_libelle || '—'}
                      </strong>
                    </div>

                    <div>
                      <span>Référence</span>
                      <strong>
                        {rule.reference_juridique || '—'}
                      </strong>
                    </div>

                    <div>
                      <span>Article</span>
                      <strong>
                        {rule.article || '—'}
                      </strong>
                    </div>
                  </div>
                </>
              ) : (
                <div className="career-rule-empty">
                  <XCircle size={18} />
                  <span>Aucune règle applicable identifiée.</span>
                </div>
              )}
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

            {analysis.echelon_suivant_existe ? (
              <div className="career-next-result">
                <CheckCircle2 size={20} />

                <div>
                  <span>Échelon suivant</span>
                  <strong>
                    {analysis.echelon_suivant?.echelon_libelle ||
                      analysis.echelon_suivant?.libelle ||
                      'Échelon suivant disponible'}
                  </strong>
                </div>
              </div>
            ) : analysis.classe_suivante_existe ? (
              <div className="career-next-result">
                <CheckCircle2 size={20} />

                <div>
                  <span>Classe suivante</span>
                  <strong>
                    {nextClass?.libelle || 'Classe suivante disponible'}
                  </strong>

                  <p>
                    Aucun échelon suivant n'existe dans la classe
                    actuelle. Le passage à la classe suivante doit
                    être examiné selon les règles applicables.
                  </p>
                </div>
              </div>
            ) : (
              <div className="career-next-result neutral">
                <XCircle size={20} />

                <div>
                  <span>Évolution identifiée</span>
                  <strong>
                    Aucune évolution suivante identifiée
                  </strong>
                </div>
              </div>
            )}
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
                    key={item.id}
                  >
                    <div className="career-timeline-marker" />

                    <div className="career-timeline-content">
                      <div className="career-timeline-top">
                        <strong>
                          {item.classe_libelle || item.classe || '—'}
                          {' · '}
                          {item.echelon_libelle ||
                            item.echelon ||
                            '—'}
                        </strong>

                        <span>
                          {getHistoryDate(item)}
                        </span>
                      </div>

                      <p>
                        {item.grade_libelle ||
                          item.grade ||
                          'Grade non renseigné'}
                        {' · '}
                        {item.corps_libelle ||
                          item.corps ||
                          'Corps non renseigné'}
                      </p>

                      <div className="career-timeline-details">
                        <span>
                          Indice : {item.indice ?? '—'}
                        </span>

                        <span>
                          Statut : {item.statut_libelle || '—'}
                        </span>

                        {item.date_fin && (
                          <span>
                            Fin : {formatDate(item.date_fin)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="career-conclusion">
            <div className="career-conclusion-icon">
              <UserRound size={20} />
            </div>

            <div>
              <p className="page-eyebrow">
                CONCLUSION DU MOTEUR RH
              </p>

              <p>{analysis.conclusion}</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}