import { useId, useState } from 'react';
import { ChevronDown, Palmtree } from 'lucide-react';
import { formatJour, formatJours } from '../../utils/documentCycle';

/**
 * Les congés de l'année sur une ligne : acquis, pris, disponibles, congé en
 * cours ; le détail des congés pris ne s'ouvre que sur demande.
 * conges : la réponse de /carrieres/employes/{id}/conges.
 */
export default function CongesResume({ conges }) {
  const detail = useId();
  const [ouvert, setOuvert] = useState(false);
  if (!conges) return null;
  const liste = Array.isArray(conges.conges) ? conges.conges : [];

  return (
    <div className={`conges-resume${conges.enCongeJusquau ? ' is-en-conge' : ''}`}>
      <div className="conges-resume-ligne">
        <span className="conges-resume-icone" aria-hidden="true"><Palmtree size={16} /></span>
        <strong>Congés {conges.annee}</strong>
        <span className="conges-resume-chiffres">
          <span><b>{formatJours(conges.solde)}</b> j disponibles</span>
          <span>{formatJours(conges.acquis)} acquis</span>
          <span>{formatJours(conges.pris)} pris</span>
        </span>
        {conges.enCongeJusquau && (
          <span className="conges-resume-encours">En congé jusqu’au {formatJour(conges.enCongeJusquau)}</span>
        )}
        {liste.length > 0 && (
          <button
            type="button"
            className="conges-resume-bouton"
            aria-expanded={ouvert}
            aria-controls={detail}
            onClick={() => setOuvert((valeur) => !valeur)}
          >
            {liste.length} {liste.length > 1 ? 'congés' : 'congé'} cette année
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      {ouvert && (
        <ul id={detail} className="conges-resume-detail">
          {liste.map((conge) => (
            <li key={conge.id}>
              <span>Du {formatJour(conge.date_debut)} au {formatJour(conge.date_fin)}</span>
              <span>{formatJours(conge.jours)} j</span>
              <span className="rf-mono">{conge.reference_document || 'Saisie directe'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
