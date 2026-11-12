import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { titulariser } from '../../api/carrieres';
import { isoToday } from '../../utils/documentCycle';

/**
 * Titularisation d'un contractuel ou d'un stagiaire : son indice actuel est
 * placé parmi les grades de fonctionnaire de sa catégorie ; le grade de même
 * indice, sinon le premier au-dessus, est proposé. Un humain confirme ou choisit.
 */
export default function TitularisationConfirmation({ employeId, analyse, onDone, onCancel }) {
  const today = isoToday();
  const suggestion = analyse.suggestion;
  const [gradeId, setGradeId] = useState(String(suggestion.echelon_id));
  const [dateEffet, setDateEffet] = useState(today);
  const [envoi, setEnvoi] = useState({ running: false, error: '' });

  const actuelle = analyse.situationActuelle || {};
  const options = analyse.options || [];
  const indice = Number(actuelle.indice);
  // L'intervalle : les grades autour de l'indice actuel, le proposé au milieu.
  const position = options.findIndex((o) => o.echelon_id === suggestion.echelon_id);
  const fenetre = options.slice(Math.max(0, position - 2), Math.max(0, position - 2) + 5);
  const choisi = options.find((o) => String(o.echelon_id) === gradeId);

  async function confirmer() {
    setEnvoi({ running: true, error: '' });
    try {
      await titulariser(employeId, dateEffet, Number(gradeId));
      onDone?.();
    } catch (err) {
      setEnvoi({ running: false, error: err?.message || 'La titularisation n’a pas pu être enregistrée.' });
    }
  }

  return (
    <div className="titularisation-carte">
      <p className="titularisation-explication">
        {analyse.typeEmploi} · indice actuel <strong>{actuelle.indice}</strong> → <strong>{suggestion.code}</strong> ({suggestion.libelle}),
        indice <strong>{suggestion.indice}</strong>
        {Number(suggestion.indice) === indice ? ' : même indice' : ' : premier indice supérieur'}
        {` — catégorie ${actuelle.categorie} conservée.`}
      </p>
      <ol className="titularisation-echelle" aria-label="Grades de fonctionnaire autour de l’indice actuel">
        {fenetre.map((option) => {
          const propose = option.echelon_id === suggestion.echelon_id;
          return (
            <li key={option.echelon_id} className={`${propose ? 'is-propose' : ''}${Number(option.indice) < indice ? ' is-dessous' : ''}`}>
              <strong>{option.code}</strong>
              <span>{option.indice}</span>
              {propose && <em>{Number(option.indice) === indice ? 'Indice identique' : 'Premier au-dessus'}</em>}
            </li>
          );
        })}
      </ol>
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
      <p className="titularisation-note">Il devient fonctionnaire au grade choisi ; sa période actuelle se ferme la veille.</p>
      <div className="documents-aside-actions">
        <button
          type="button"
          className="rf-btn rf-btn-primary"
          disabled={envoi.running || !gradeId || !dateEffet}
          onClick={confirmer}
        >
          {envoi.running ? 'Enregistrement…' : 'Confirmer la titularisation'}
        </button>
        <button type="button" className="rf-btn" disabled={envoi.running} onClick={onCancel}>Revenir</button>
      </div>
      {envoi.error && <p className="rf-error" role="alert">{envoi.error}</p>}
    </div>
  );
}
