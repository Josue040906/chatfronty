import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CalendarDays, Hourglass, Palmtree, TrendingUp } from 'lucide-react';
import { getConges, getRetraiteAnalyse, prendreRetraite } from '../../api/carrieres';
import { formatJour, formatJours, isoToday, joursJusqua } from '../../utils/documentCycle';
import TitularisationCarte from './TitularisationCarte';

/** Le jour où la durée minimale dans l'échelon actuel est atteinte, s'il est connu. */
function dateAvancementPossible(analysis) {
  const debut = analysis?.situationActuelle?.dateDebut;
  const annees = analysis?.dureeMin;
  if (!debut || annees == null) return null;
  const [a, m, j] = String(debut).slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(a + Number(annees), m - 1, j));
  return date.toISOString().slice(0, 10);
}

function quand(date, today) {
  if (!date) return null;
  const jours = joursJusqua(date, today);
  return jours <= 0 ? 'dès aujourd’hui' : `à partir du ${formatJour(date)}`;
}

/**
 * Faire une demande pour cet agent, sans rien ressaisir : le type et l'agent
 * sont fixés, la demande s'appliquera à sa date d'effet. La retraite peut
 * aussi être prise directement, avec le même effet qu'une demande appliquée.
 */
export default function DemandesCarriere({ employeId, analysis, canManageHr, onChanged }) {
  const navigate = useNavigate();
  const today = isoToday();
  const [retraite, setRetraite] = useState(null);
  const [conges, setConges] = useState(null);
  const [confirmer, setConfirmer] = useState(false);
  const [dateDepart, setDateDepart] = useState(today);
  const [envoi, setEnvoi] = useState({ running: false, error: '', message: '' });

  useEffect(() => {
    let cancelled = false;
    getRetraiteAnalyse(employeId)
      .then((result) => { if (!cancelled) setRetraite(result); })
      .catch(() => { if (!cancelled) setRetraite(null); });
    getConges(employeId)
      .then((result) => { if (!cancelled) setConges(result); })
      .catch(() => { if (!cancelled) setConges(null); });
    return () => { cancelled = true; };
  }, [employeId, envoi.message]);

  function preparer(typeCode) {
    navigate('/documents/nouveau', { state: { demandeCarriere: { typeCode, employeId } } });
  }

  async function confirmerRetraite() {
    setEnvoi({ running: true, error: '', message: '' });
    try {
      await prendreRetraite(employeId, dateDepart);
      setConfirmer(false);
      setEnvoi({ running: false, error: '', message: 'Départ à la retraite enregistré.' });
      onChanged?.();
    } catch (err) {
      setEnvoi({ running: false, error: err?.message || 'Le départ n’a pas pu être enregistré.', message: '' });
    }
  }

  const avancement = dateAvancementPossible(analysis);
  const dejaRetraite = Boolean(retraite?.dateRetraite);
  const cartes = [
    {
      code: 'AVANCEMENT',
      titre: 'Avancement',
      icone: TrendingUp,
      detail: avancement ? `Possible ${quand(avancement, today)}` : 'Durée minimale non renseignée',
      ton: avancement && joursJusqua(avancement, today) <= 0 ? 'pret' : 'attente',
    },
    {
      code: 'MUTATION',
      titre: 'Mutation',
      icone: BriefcaseBusiness,
      detail: 'Service, poste ou lieu, à la date choisie',
      ton: 'neutre',
    },
    {
      code: 'CONGE',
      titre: 'Congé',
      icone: Palmtree,
      detail: conges
        ? conges.enCongeJusquau
          ? `En congé jusqu’au ${formatJour(conges.enCongeJusquau)} · ${formatJours(conges.solde)} jours restants`
          : `${formatJours(conges.solde)} jours disponibles · ${formatJours(conges.pris)} pris en ${conges.annee}`
        : 'Solde indisponible',
      ton: conges && Number(conges.solde) > 0 ? 'pret' : 'neutre',
      progression: conges && conges.joursParMois
        ? Math.max(0, Math.min(1, Number(conges.solde) / (Number(conges.joursParMois) * 12)))
        : null,
    },
    {
      code: 'RETRAITE',
      titre: 'Retraite',
      icone: Hourglass,
      detail: dejaRetraite
        ? `Partie à la retraite le ${formatJour(retraite.dateRetraite)}`
        : retraite?.datePossible
          ? `${retraite.anneesRequises} ans de service atteints ${retraite.possible
            ? `depuis le ${formatJour(retraite.datePossible)}`
            : `le ${formatJour(retraite.datePossible)}`}`
          : 'Durée de service non calculable',
      ton: dejaRetraite ? 'fini' : retraite?.possible ? 'pret' : 'attente',
      progression: retraite?.datePossible && !retraite.possible && retraite.anneesRequises
        ? Math.max(0, Math.min(1, 1 - retraite.joursRestants / (retraite.anneesRequises * 365.25)))
        : null,
    },
  ];

  return (
    <section className="career-section demandes-carriere" aria-labelledby="demandes-carriere-titre">
      <div className="career-section-heading">
        <div>
          <p className="rf-eyebrow">Demandes</p>
          <h2 id="demandes-carriere-titre">Faire une demande</h2>
        </div>
      </div>
      <TitularisationCarte employeId={employeId} canManageHr={canManageHr} onChanged={onChanged} />
      <div className="demandes-carriere-grille">
        {cartes.map((carte) => {
          const Icone = carte.icone;
          const fermee = carte.code === 'RETRAITE' && dejaRetraite;
          return (
            <article key={carte.code} className={`demande-carte is-${carte.ton}`}>
              <span className="demande-carte-icone"><Icone size={20} /></span>
              <h3>{carte.titre}</h3>
              <p>{carte.detail}</p>
              {carte.progression != null && (
                <span className="demande-carte-jauge" aria-label={`${Math.round(carte.progression * 100)} % de la durée de service`}>
                  <span style={{ width: `${carte.progression * 100}%` }} />
                </span>
              )}
              <div className="demande-carte-actions">
                <button
                  type="button"
                  className="rf-btn rf-btn-sm"
                  onClick={() => preparer(carte.code)}
                  disabled={fermee}
                >
                  Préparer la demande <ArrowRight size={15} />
                </button>
                {carte.code === 'RETRAITE' && canManageHr && retraite?.possible && !dejaRetraite && !confirmer && (
                  <button
                    type="button"
                    className="rf-btn rf-btn-sm rf-btn-primary"
                    onClick={() => { setConfirmer(true); setEnvoi({ running: false, error: '', message: '' }); }}
                  >
                    Prendre sa retraite
                  </button>
                )}
              </div>
              {carte.code === 'RETRAITE' && confirmer && (
                <div className="demande-confirmation">
                  <p>
                    <strong>Départ à la retraite</strong>
                    L’affectation et la période de carrière en cours se ferment à cette date.
                  </p>
                  <label className="demande-carte-date">
                    <CalendarDays size={16} />
                    <input
                      type="date"
                      value={dateDepart}
                      min={retraite?.datePossible || undefined}
                      max={today}
                      onChange={(event) => setDateDepart(event.target.value)}
                    />
                  </label>
                  <div className="documents-aside-actions">
                    <button
                      type="button"
                      className="rf-btn rf-btn-primary"
                      disabled={envoi.running || !dateDepart}
                      onClick={confirmerRetraite}
                    >
                      {envoi.running ? 'Enregistrement…' : 'Confirmer le départ'}
                    </button>
                    <button type="button" className="rf-btn" disabled={envoi.running} onClick={() => setConfirmer(false)}>
                      Revenir
                    </button>
                  </div>
                </div>
              )}
              {carte.code === 'RETRAITE' && envoi.error && <p className="rf-error" role="alert">{envoi.error}</p>}
              {carte.code === 'RETRAITE' && envoi.message && <p className="rf-success" role="status">{envoi.message}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
