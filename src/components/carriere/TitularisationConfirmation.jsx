import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { titulariser } from '../../api/carrieres';
import { isoToday } from '../../utils/documentCycle';

/**
 * Titularisation d'un contractuel ou d'un stagiaire : son indice actuel est
 * placé parmi les grades de fonctionnaire de sa catégorie. Le grade est celui de
 * même indice, sinon le premier au-dessus — il n'est pas au choix ; un humain
 * confirme la titularisation.
 */
export default function TitularisationConfirmation({ employeId, analyse, onDone, onCancel }) {
  const today = isoToday();
  const grade = analyse.suggestion;
  const [dateEffet, setDateEffet] = useState(today);
  const [envoi, setEnvoi] = useState({ running: false, error: '' });

  const actuelle = analyse.situationActuelle || {};
  const options = analyse.options || [];
  const indice = Number(actuelle.indice);
  // L'intervalle : les grades autour de l'indice actuel, le retenu au milieu.
  const position = options.findIndex((o) => o.echelon_id === grade.echelon_id);
  const fenetre = options.slice(Math.max(0, position - 2), Math.max(0, position - 2) + 5);

  async function confirmer() {
    setEnvoi({ running: true, error: '' });
    try {
      await titulariser(employeId, dateEffet);
      onDone?.();
    } catch (err) {
      setEnvoi({ running: false, error: err?.message || 'La titularisation n’a pas pu être enregistrée.' });
    }
  }

  return (
    <div className="titularisation-carte">
      <p className="titularisation-explication">
        {analyse.typeEmploi} · indice actuel <strong>{actuelle.indice}</strong> → <strong>{grade.code}</strong> ({grade.libelle}),
        indice <strong>{grade.indice}</strong>
        {Number(grade.indice) === indice ? ' : même indice' : ' : premier indice supérieur'}
        {` — catégorie ${actuelle.categorie} conservée.`}
      </p>
      <ol className="titularisation-echelle" aria-label="Grades de fonctionnaire autour de l’indice actuel">
        {fenetre.map((option) => {
          const retenu = option.echelon_id === grade.echelon_id;
          return (
            <li key={option.echelon_id} className={`${retenu ? 'is-propose' : ''}${Number(option.indice) < indice ? ' is-dessous' : ''}`}>
              <strong>{option.code}</strong>
              <span>{option.indice}</span>
              {retenu && <em>{Number(option.indice) === indice ? 'Indice identique' : 'Premier au-dessus'}</em>}
            </li>
          );
        })}
      </ol>
      <div className="titularisation-choix">
        <label className="demande-carte-date">
          <CalendarDays size={16} />
          <input type="date" value={dateEffet} max={today} onChange={(event) => setDateEffet(event.target.value)} />
        </label>
      </div>
      <p className="titularisation-note">Il devient fonctionnaire à ce grade ; sa période actuelle se ferme la veille.</p>
      <div className="documents-aside-actions">
        <button
          type="button"
          className="rf-btn rf-btn-primary"
          disabled={envoi.running || !dateEffet}
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
