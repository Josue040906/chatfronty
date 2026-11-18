import { useEffect, useState } from 'react';
import { classeTypeEmploi } from '../../utils/typeEmploi';
import { Armchair, Hourglass, Palmtree, UserRoundSearch, X } from 'lucide-react';
import { getEtatPostes } from '../../api/postes';
import CandidatsReleve from './CandidatsReleve';
import { formatJour } from '../../utils/documentCycle';
import { totauxPostes } from '../../utils/postes';
import { getEmployeeInitials, getEmployeePhotoUrl } from '../../utils/employee';
import { estServicePersonnel } from '../../utils/session';
import { Link } from 'react-router-dom';
import PersonPhoto from '../agents/PersonPhoto';
import TypeEmploiBadge from '../agents/TypeEmploiBadge';

/**
 * Plan des postes d'un service ou d'une direction : chaque poste est une rangée
 * de sièges. Un siège occupé montre l'agent, un siège libre est en pointillés,
 * un siège qui se libère porte un sablier et sa date ; « Qui pourrait
 * reprendre ? » propose une relève (une aide : l'humain décide).
 */
export default function PlanDesPostes({ serviceId, directionId, onAgentClick }) {
  const [postes, setPostes] = useState(null);
  const [erreur, setErreur] = useState('');
  const [releve, setReleve] = useState(null);
  // Le Service du Personnel pourvoit les places libres depuis la page Gestion des postes.
  const peutGerer = estServicePersonnel();

  useEffect(() => {
    let cancelled = false;
    getEtatPostes({ serviceId, directionId })
      .then((resultat) => { if (!cancelled) setPostes(resultat); })
      .catch((err) => { if (!cancelled) setErreur(err?.message || 'Impossible de charger les postes.'); });
    return () => { cancelled = true; };
  }, [serviceId, directionId]);

  function ouvrirReleve(poste) {
    setReleve({ poste });
  }

  if (erreur) return <p className="rf-error" role="alert">{erreur}</p>;
  if (!postes) return <p className="rf-note">Chargement des postes…</p>;
  if (postes.length === 0) return <p className="rf-note">Aucun poste n’est défini ici.</p>;

  const totaux = totauxPostes(postes);
  const taux = totaux.places ? Math.round((totaux.occupees / totaux.places) * 100) : 0;
  const parService = directionId
    ? postes.reduce((groupes, poste) => {
      (groupes[poste.service] = groupes[poste.service] || []).push(poste);
      return groupes;
    }, {})
    : { '': postes };

  return (
    <div className="plan-postes">
      <div className="plan-postes-jauge" aria-label={`${totaux.occupees} places occupées sur ${totaux.places}`}>
        <div className="plan-postes-chiffres">
          <span><strong>{totaux.postes}</strong> postes</span>
          <span><strong>{totaux.occupees}</strong>/{totaux.places} places occupées</span>
          <span className="is-libre"><strong>{totaux.libres}</strong> libre{totaux.libres > 1 ? 's' : ''}</span>
          {totaux.departs > 0 && (
            <span className="is-depart"><strong>{totaux.departs}</strong> départ{totaux.departs > 1 ? 's' : ''} dans l’année</span>
          )}
        </div>
        <span className="plan-postes-barre"><span style={{ width: `${taux}%` }} /></span>
      </div>

      {Object.entries(parService).map(([service, liste]) => (
        <section key={service || 'service'} className="plan-postes-service">
          {service && <h3>{service}</h3>}
          {liste.map((poste) => (
            <div key={poste.id} className={`plan-poste is-${String(poste.statut).toLowerCase()}`}>
              <div className="plan-poste-tete">
                <strong>{poste.intitule}</strong>
                <span>{poste.occupes}/{poste.nombre_places}</span>
              </div>
              <div className="plan-poste-sieges">
                {poste.occupants.map((agent, index) => (
                  <button
                    key={agent.id}
                    type="button"
                    className={`plan-siege is-occupe${agent.depart_prevu ? ' is-depart' : ''}`}
                    onClick={() => onAgentClick?.(agent.id)}
                    title={`${agent.prenom || ''} ${agent.nom || ''}`.trim()}
                  >
                    <span className={`plan-siege-avatar rf-avatar-tone-${index % 5} avatar-type ${classeTypeEmploi(agent.type_emploi)}`}>
                      <PersonPhoto
                        src={getEmployeePhotoUrl(agent.photo)}
                        alt=""
                        initials={getEmployeeInitials(agent)}
                      />
                    </span>
                    <span className="plan-siege-nom">{agent.prenom} {agent.nom}</span>
                    <TypeEmploiBadge type={agent.type_emploi} />
                    {agent.en_conge_jusquau && (
                      <small className="plan-siege-note"><Palmtree size={12} /> En congé</small>
                    )}
                    {agent.depart_prevu && (
                      <small className="plan-siege-note is-depart">
                        <Hourglass size={12} /> Se libère le {formatJour(agent.depart_prevu)}
                      </small>
                    )}
                  </button>
                ))}
                {Array.from({ length: poste.libres }, (_, index) => (peutGerer ? (
                  <Link
                    key={`libre-${index}`}
                    to={`/postes?poste=${poste.id}`}
                    className="plan-siege is-libre is-lien"
                    title={`Choisir un agent pour le poste ${poste.intitule}`}
                  >
                    <Armchair size={18} aria-hidden="true" />
                    <span className="plan-siege-nom">Libre</span>
                    <small className="plan-siege-note">Choisir un agent →</small>
                  </Link>
                ) : (
                  <span key={`libre-${index}`} className="plan-siege is-libre">
                    <Armchair size={18} aria-hidden="true" />
                    <span className="plan-siege-nom">Libre</span>
                  </span>
                )))}
              </div>
              {poste.statut === 'SE_LIBERE' && peutGerer && (
                <Link className="rf-btn rf-btn-sm plan-poste-releve" to={`/postes?poste=${poste.id}`}>
                  <UserRoundSearch size={15} /> Choisir un successeur
                </Link>
              )}
              {poste.statut === 'SE_LIBERE' && !peutGerer && (
                <button type="button" className="rf-btn rf-btn-sm plan-poste-releve" onClick={() => ouvrirReleve(poste)}>
                  <UserRoundSearch size={15} /> Qui pourrait reprendre ce poste ?
                </button>
              )}
              {releve?.poste.id === poste.id && (
                <div className="plan-releve">
                  <div className="plan-releve-tete">
                    <strong>Relève possible</strong>
                    <button type="button" className="rf-icon-btn" aria-label="Fermer" onClick={() => setReleve(null)}>
                      <X size={14} />
                    </button>
                  </div>
                  <p>Agents de la même direction, classés selon ce qui les rapproche du poste. L’humain décide.</p>
                  <CandidatsReleve
                    posteId={poste.id}
                    renderAction={onAgentClick ? (agent) => (
                      <button type="button" className="rf-btn rf-btn-sm" onClick={() => onAgentClick(agent.id)}>Voir</button>
                    ) : undefined}
                  />
                </div>
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
