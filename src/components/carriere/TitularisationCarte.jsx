import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CalendarDays } from 'lucide-react';
import { getTitularisation, titulariser } from '../../api/carrieres';
import { isoToday } from '../../utils/documentCycle';

/**
 * Titularisation d'un contractuel ou d'un stagiaire : son indice actuel est
 * placé parmi les grades de fonctionnaire de sa catégorie ; le grade de même
 * indice, sinon le premier au-dessus, est proposé. Un humain confirme ou choisit.
 */
export default function TitularisationCarte({ employeId, canManageHr, onChanged }) {
  const navigate = useNavigate();
  const today = isoToday();
  const [analyse, setAnalyse] = useState(null);
  const [confirmer, setConfirmer] = useState(false);
  const [gradeId, setGradeId] = useState('');
  const [dateEffet, setDateEffet] = useState(today);
  const [envoi, setEnvoi] = useState({ running: false, error: '', message: '' });

  useEffect(() => {
    let cancelled = false;
    getTitularisation(employeId)
      .then((result) => {
        if (cancelled) return;
        setAnalyse(result);
        setGradeId(result?.suggestion ? String(result.suggestion.echelon_id) : '');
      })
      .catch(() => { if (!cancelled) setAnalyse(null); });
    return () => { cancelled = true; };
  }, [employeId, envoi.message]);

  if (!analyse || (!analyse.possible && analyse.typeEmploi === 'Fonctionnaire' && !envoi.message)) return null;

  const actuelle = analyse.situationActuelle || {};
  const options = analyse.options || [];
  const suggestion = analyse.suggestion;
  const indice = Number(actuelle.indice);
  // L'intervalle : les grades autour de l'indice actuel, le proposé au milieu.
  const position = suggestion ? options.findIndex((o) => o.echelon_id === suggestion.echelon_id) : -1;
  const fenetre = options.slice(Math.max(0, position - 2), Math.max(0, position - 2) + 5);
  const choisi = options.find((o) => String(o.echelon_id) === gradeId);

  async function confirmerTitularisation() {
    setEnvoi({ running: true, error: '', message: '' });
    try {
      await titulariser(employeId, dateEffet, Number(gradeId));
      setConfirmer(false);
      setEnvoi({ running: false, error: '', message: 'Titularisation enregistrée : l’agent est fonctionnaire.' });
      onChanged?.();
    } catch (err) {
      setEnvoi({ running: false, error: err?.message || 'La titularisation n’a pas pu être enregistrée.', message: '' });
    }
  }

  return (
    <article className="titularisation-carte">
      <div className="titularisation-tete">
        <span className="demande-carte-icone"><BadgeCheck size={20} /></span>
        <div>
          <h3>Titularisation</h3>
          <p>
            {analyse.possible
              ? `${analyse.typeEmploi} · ${actuelle.gradeCode} · indice ${actuelle.indice} — catégorie ${actuelle.categorie} conservée`
              : envoi.message || analyse.raison}
          </p>
        </div>
      </div>

      {analyse.possible && suggestion && (
        <>
          <ol className="titularisation-echelle" aria-label="Grades de fonctionnaire autour de l’indice actuel">
            {fenetre.map((option) => {
              const exact = Number(option.indice) === indice;
              const propose = option.echelon_id === suggestion.echelon_id;
              return (
                <li key={option.echelon_id} className={`${propose ? 'is-propose' : ''}${Number(option.indice) < indice ? ' is-dessous' : ''}`}>
                  <strong>{option.code}</strong>
                  <span>{option.indice}</span>
                  {propose && <em>{exact ? 'Indice identique' : 'Premier au-dessus'}</em>}
                </li>
              );
            })}
          </ol>
          <p className="titularisation-explication">
            Indice actuel <strong>{actuelle.indice}</strong> → <strong>{suggestion.code}</strong> ({suggestion.libelle}),
            indice <strong>{suggestion.indice}</strong>
            {Number(suggestion.indice) === indice ? ' : même indice.' : ' : premier indice supérieur.'}
          </p>

          <div className="demande-carte-actions">
            <button
              type="button"
              className="rf-btn rf-btn-sm"
              onClick={() => navigate('/documents/nouveau', {
                state: { demandeCarriere: { typeCode: 'TITULARISATION', employeId } },
              })}
            >
              Préparer la demande <ArrowRight size={15} />
            </button>
            {canManageHr && !confirmer && (
              <button
                type="button"
                className="rf-btn rf-btn-sm rf-btn-primary"
                onClick={() => { setConfirmer(true); setEnvoi({ running: false, error: '', message: '' }); }}
              >
                Titulariser
              </button>
            )}
          </div>

          {confirmer && (
            <div className="demande-confirmation">
              <p>
                <strong>Titulariser l’agent</strong>
                Il devient fonctionnaire au grade choisi ; sa période actuelle se ferme la veille.
              </p>
              <div className="titularisation-choix">
                <label>
                  Grade
                  <select value={gradeId} onChange={(event) => setGradeId(event.target.value)}>
                    {options.map((option) => (
                      <option key={option.echelon_id} value={option.echelon_id}>
                        {option.code} — {option.libelle} (indice {option.indice})
                        {option.echelon_id === suggestion.echelon_id ? ' · proposé' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="demande-carte-date">
                  <CalendarDays size={16} />
                  <input type="date" value={dateEffet} max={today} onChange={(event) => setDateEffet(event.target.value)} />
                </label>
              </div>
              {choisi && Number(choisi.indice) < indice && (
                <p className="rf-error">Ce grade a un indice inférieur à l’indice actuel de l’agent.</p>
              )}
              <div className="documents-aside-actions">
                <button
                  type="button"
                  className="rf-btn rf-btn-primary"
                  disabled={envoi.running || !gradeId || !dateEffet}
                  onClick={confirmerTitularisation}
                >
                  {envoi.running ? 'Enregistrement…' : 'Confirmer la titularisation'}
                </button>
                <button type="button" className="rf-btn" disabled={envoi.running} onClick={() => setConfirmer(false)}>
                  Revenir
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {envoi.error && <p className="rf-error" role="alert">{envoi.error}</p>}
      {envoi.message && <p className="rf-success" role="status">{envoi.message}</p>}
    </article>
  );
}
