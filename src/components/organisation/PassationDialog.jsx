import LienAgent from '../agents/LienAgent';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, X } from 'lucide-react';
import { getReleve as getCandidats } from '../../api/postes';
import { designerReleve, retirerReleve } from '../../api/releve';
import { formatJour } from '../../utils/documentCycle';
import { getEmployeeInitials, getEmployeePhotoUrl } from '../../utils/employee';
import PersonPhoto from '../agents/PersonPhoto';
import { useToast } from '../ui/toastContext';

const PREPARATIONS = [
  { value: 'A_PREPARER', label: 'À préparer' },
  { value: 'EN_PREPARATION', label: 'En préparation' },
  { value: 'PRET', label: 'Prêt' },
];

/** « dans 4 ans et 2 mois », ou « dès maintenant » si la date est passée. */
function delai(date) {
  if (!date) return '';
  const fin = new Date(date);
  const maintenant = new Date();
  if (fin <= maintenant) return 'dès maintenant';
  let mois = (fin.getFullYear() - maintenant.getFullYear()) * 12 + fin.getMonth() - maintenant.getMonth();
  if (fin.getDate() < maintenant.getDate()) mois -= 1;
  const ans = Math.floor(mois / 12);
  const reste = mois % 12;
  const morceaux = [];
  if (ans) morceaux.push(`${ans} an${ans > 1 ? 's' : ''}`);
  if (reste) morceaux.push(`${reste} mois`);
  return morceaux.length ? `dans ${morceaux.join(' et ')}` : 'dans moins d’un mois';
}

/**
 * Pourvoir un poste, en deux étapes :
 * 1. qui peut l'occuper (les candidats classés par l'API, avec leur photo et leurs raisons) ;
 * 2. désigner, puis suivre la préparation avec une note.
 * Le même geste sert à un poste déjà libre (type « libre ») et à un poste dont
 * le titulaire va partir (passation). Désigner ne mute personne : c'est un plan.
 */
export default function PassationDialog({ poste, onClose, onChange }) {
  const id = useId();
  const toast = useToast();
  const libre = poste.type === 'libre';
  const plan = poste.releve;
  const [etape, setEtape] = useState(plan ? 2 : 1);
  const [candidats, setCandidats] = useState({ liste: null, erreur: '' });
  const [choix, setChoix] = useState(plan
    ? { id: plan.successeur_id, prenom: plan.successeur_prenom, nom: plan.successeur_nom }
    : null);
  const [statut, setStatut] = useState(plan?.statut || 'A_PREPARER');
  const [note, setNote] = useState(plan?.note || '');
  const [envoi, setEnvoi] = useState(false);
  const [description, setDescription] = useState(false);
  const partant = poste.titulaires_partants?.[0];

  useEffect(() => {
    let actif = true;
    getCandidats(poste.poste_id)
      .then((liste) => {
        if (!actif) return;
        setCandidats({ liste, erreur: '' });
        setChoix((courant) => courant || liste[0] || null);
      })
      .catch((err) => { if (actif) setCandidats({ liste: [], erreur: err?.message || 'Impossible de proposer des candidats.' }); });
    return () => { actif = false; };
  }, [poste.poste_id]);

  useEffect(() => {
    function echap(event) { if (event.key === 'Escape' && !envoi) onClose(); }
    document.addEventListener('keydown', echap);
    return () => document.removeEventListener('keydown', echap);
  }, [envoi, onClose]);

  async function enregistrer(event) {
    event.preventDefault();
    if (!choix) return;
    setEnvoi(true);
    try {
      await designerReleve(poste.poste_id, { successeurId: choix.id, statut, note });
      toast.succes(plan && plan.successeur_id === choix.id
        ? 'Suivi mis à jour.'
        : `${choix.prenom} ${choix.nom} est pressenti·e pour le poste ${poste.poste}.`);
      onChange();
      onClose();
    } catch (err) {
      toast.erreur(err?.message || 'Le choix n’a pas pu être enregistré.');
      setEnvoi(false);
    }
  }

  async function retirer() {
    setEnvoi(true);
    try {
      await retirerReleve(poste.poste_id);
      toast.succes(`Plus personne n’est pressenti pour le poste ${poste.poste}.`);
      onChange();
      onClose();
    } catch (err) {
      toast.erreur(err?.message || 'Le choix n’a pas pu être retiré.');
      setEnvoi(false);
    }
  }

  const choisi = candidats.liste?.find((agent) => agent.id === choix?.id);

  return (
    <div
      className="rf-overlay"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !envoi) onClose(); }}
    >
      <form className="rf-card passation" role="dialog" aria-modal="true" aria-labelledby={`${id}-titre`} onSubmit={enregistrer}>
        <header className="passation-tete">
          <div>
            <p className="rf-eyebrow">{libre ? 'Poste à pourvoir' : 'Passation'}</p>
            <h2 id={`${id}-titre`}>{poste.poste}</h2>
            <p className="passation-depart">{[poste.service, poste.direction].filter(Boolean).join(' · ')}</p>
            <p className="passation-contexte">
              {libre
                ? `${poste.libres} place${poste.libres > 1 ? 's' : ''} libre${poste.libres > 1 ? 's' : ''} sur ${poste.places}, dès maintenant.`
                : partant && (
                  <>
                    <LienAgent id={partant.id} nom={partant.nom} photo={partant.photo} /> part le {formatJour(partant.depart_prevu)}, {delai(partant.depart_prevu)}.
                    {poste.titulaires_partants.length > 1 ? ` ${poste.titulaires_partants.length - 1} autre(s) titulaire(s) partent aussi.` : ''}
                  </>
                )}
            </p>
            {poste.description && (
              <>
                <button type="button" className={`passation-poste-btn${description ? ' is-ouvert' : ''}`} aria-expanded={description}
                  aria-controls={`${id}-description`} onClick={() => setDescription((valeur) => !valeur)}>
                  <ChevronDown size={14} aria-hidden="true" /> {description ? 'Masquer' : 'Voir'} la description du poste
                </button>
                {description && <p id={`${id}-description`} className="passation-description">{poste.description}</p>}
              </>
            )}
          </div>
          <button type="button" className="rf-icon-btn" aria-label="Fermer" disabled={envoi} onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        <ol className="passation-etapes" aria-label="Étapes">
          <li className="is-faite" aria-current={etape === 1 ? 'step' : undefined}>
            <span />1 · {libre ? 'Qui peut l’occuper ?' : 'Qui peut lui succéder ?'}
          </li>
          <li className={etape === 2 ? 'is-faite' : ''} aria-current={etape === 2 ? 'step' : undefined}>
            <span />2 · Désigner et suivre
          </li>
        </ol>

        {etape === 1 && (
          <fieldset className="passation-candidats">
            <legend className="ui-visually-hidden">Candidats possibles</legend>
            {candidats.erreur && <p className="rf-error">{candidats.erreur}</p>}
            {!candidats.liste && <p className="rf-note" role="status">Recherche des candidats possibles…</p>}
            {candidats.liste?.length === 0 && (
              <p className="rf-note">Aucun agent de la direction ne remplit les conditions pour l’instant.</p>
            )}
            {candidats.liste?.map((agent, rang) => (
              <label key={agent.id} className={`passation-candidat${choix?.id === agent.id ? ' is-choisi' : ''}`}>
                <input
                  type="radio"
                  className="ui-visually-hidden"
                  name={`${id}-candidat`}
                  checked={choix?.id === agent.id}
                  onChange={() => setChoix(agent)}
                />
                <span className="passation-photo" aria-hidden="true">
                  <PersonPhoto src={getEmployeePhotoUrl(agent.photo)} alt="" initials={getEmployeeInitials(agent)} />
                  <span className="passation-rang">{rang + 1}</span>
                </span>
                <span className="passation-candidat-texte">
                  <strong>{agent.prenom} {agent.nom}</strong>
                  <small>{[agent.poste, agent.service].filter(Boolean).join(' · ')}</small>
                  {agent.raisons?.length > 0 && (
                    <span className="passation-raisons">
                      {agent.raisons.map((raison) => <span key={raison}>{raison}</span>)}
                    </span>
                  )}
                </span>
                <Link className="passation-profil" to={`/agents/${agent.id}`}>Profil</Link>
              </label>
            ))}
            {candidats.liste?.length > 0 && (
              <p className="passation-aide">
                Classés selon le service, la catégorie, les compétences et le diplôme{libre ? '' : ' communs avec le titulaire'}, et l’ancienneté.
              </p>
            )}
          </fieldset>
        )}

        {etape === 2 && choix && (
          <div className="passation-suivi">
            <div className="passation-choisi">
              <span className="passation-photo" aria-hidden="true">
                <PersonPhoto src={getEmployeePhotoUrl(choisi?.photo)} alt="" initials={getEmployeeInitials(choix)} />
              </span>
              <span>
                <small>{libre ? 'Pressenti·e pour le poste' : 'Successeur pressenti'}</small>
                <LienAgent id={choix.id} nom={`${choix.prenom || ''} ${choix.nom || ''}`.trim()} variante="texte" />
                {choisi?.poste ? <small>{choisi.poste} · {choisi.service}</small> : null}
              </span>
            </div>
            <div className="rf-field">
              <span className="rf-label" id={`${id}-prep`}>Où en est sa préparation ?</span>
              <div className="ui-segmented" role="group" aria-labelledby={`${id}-prep`}>
                {PREPARATIONS.map((option) => (
                  <button key={option.value} type="button" aria-pressed={statut === option.value}
                    onClick={() => setStatut(option.value)} disabled={envoi}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="rf-field">
              <span className="rf-label">Note</span>
              <textarea rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)}
                placeholder={libre ? 'Ex. mutation à proposer au prochain mouvement' : 'Ex. à accompagner sur la paie avant le départ'}
                disabled={envoi} />
            </label>
            <p className="passation-aide">
              Désigner ne mute personne : c’est un plan. La mutation se fait ensuite par une demande.
            </p>
          </div>
        )}

        <footer className="passation-pied">
          {etape === 1 ? (
            <>
              <button key="plus-tard" type="button" className="rf-btn rf-btn-ghost" onClick={onClose}>Plus tard</button>
              {/* Clés distinctes : sinon React réutilise ce bouton comme « Désigner » et le même clic envoie le formulaire. */}
              <button key="continuer" type="button" className="rf-btn rf-btn-primary" disabled={!choix} onClick={() => setEtape(2)}>
                {choix ? `Continuer avec ${choix.prenom}` : 'Continuer'}
              </button>
            </>
          ) : (
            <>
              <span key="gauche" className="passation-pied-gauche">
                <button type="button" className="rf-btn rf-btn-ghost" disabled={envoi} onClick={() => setEtape(1)}>
                  <ArrowLeft size={15} /> Changer
                </button>
                {plan && (
                  <button type="button" className="rf-btn rf-btn-ghost passation-retirer" disabled={envoi} onClick={retirer}>
                    Retirer
                  </button>
                )}
              </span>
              <button key="enregistrer" type="submit" className="rf-btn rf-btn-primary" disabled={envoi}>
                {plan ? 'Enregistrer' : `Désigner ${choix?.prenom || ''}`.trim()}
              </button>
            </>
          )}
        </footer>
      </form>
    </div>
  );
}
