import LienAgent from '../agents/LienAgent';
import { useEffect, useState } from 'react';
import { getReleve } from '../../api/postes';
import TypeEmploiBadge from '../agents/TypeEmploiBadge';

/**
 * Qui pourrait reprendre ce poste : les candidats classés par l'API, chacun
 * avec ses raisons (même service, compétences et diplôme en commun…).
 * renderAction(agent) : un bouton par candidat, s'il y a lieu (désigner…).
 */
export default function CandidatsReleve({ posteId, renderAction }) {
  const [etat, setEtat] = useState({ candidats: null, erreur: '' });

  useEffect(() => {
    let actif = true;
    getReleve(posteId)
      .then((candidats) => { if (actif) setEtat({ candidats, erreur: '' }); })
      .catch((err) => { if (actif) setEtat({ candidats: [], erreur: err?.message || 'Impossible de proposer une relève.' }); });
    return () => { actif = false; };
  }, [posteId]);

  if (etat.erreur) return <p className="rf-error">{etat.erreur}</p>;
  if (!etat.candidats) return <p className="rf-note">Recherche des candidats…</p>;
  if (etat.candidats.length === 0) {
    return <p className="rf-note">Aucun agent de la direction ne remplit les conditions pour l’instant.</p>;
  }

  return (
    <ol className="candidats-releve">
      {etat.candidats.map((agent, rang) => (
        <li key={agent.id} className="candidat-releve">
          <span className="candidat-rang" aria-label={`Rang ${rang + 1}`}>{rang + 1}</span>
          <div className="candidat-texte">
            <div className="candidat-nom">
              <LienAgent id={agent.id} nom={`${agent.prenom || ''} ${agent.nom || ''}`.trim()} photo={agent.photo} />
              <TypeEmploiBadge type={agent.type_emploi} />
            </div>
            <small>
              {agent.poste} · {agent.service}
              {agent.grade_code ? ` · ${agent.grade_code}` : ''}{agent.indice ? ` · indice ${agent.indice}` : ''}
            </small>
            {agent.raisons?.length > 0 && (
              <ul className="candidat-raisons">
                {agent.raisons.map((raison) => <li key={raison}>{raison}</li>)}
              </ul>
            )}
          </div>
          {renderAction && <div className="candidat-action">{renderAction(agent)}</div>}
        </li>
      ))}
    </ol>
  );
}
