import LienAgent from '../agents/LienAgent';
import { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, CircleHelp, FileSignature, Search, X } from 'lucide-react';
import { getAgents } from '../../api/agents';
import { analyserCandidat, getReleve as getCandidats } from '../../api/postes';
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

const ETATS_EXIGENCE = {
  REMPLIE: { classe: 'is-remplie', Icone: Check, titre: 'Remplie' },
  MANQUANTE: { classe: 'is-manquante', Icone: X, titre: 'Non remplie' },
  A_VERIFIER: { classe: 'is-averifier', Icone: CircleHelp, titre: 'À vérifier : sa fiche ne le dit pas' },
};

/** Le bilan d'un agent face au poste : exigences (remplies, non remplies, à vérifier) et points d'attention. */
function BilanCandidat({ agent }) {
  const exigences = agent.exigences || [];
  const remplies = exigences.filter((exigence) => exigence.etat === 'REMPLIE').length;
  return (
    <>
      {exigences.length > 0 && (
        <span className="passation-exigences">
          <span className="passation-exigences-titre">Exigences du poste : {remplies} sur {exigences.length}</span>
          {exigences.map((exigence) => {
            const { classe, Icone, titre } = ETATS_EXIGENCE[exigence.etat] || ETATS_EXIGENCE.A_VERIFIER;
            return (
              <span
                key={exigence.libelle}
                className={`passation-exigence ${classe}${exigence.indispensable ? ' is-indispensable' : ''}`}
                title={`${titre}${exigence.detail ? ` · ${exigence.detail}` : ''}${exigence.indispensable ? ' · indispensable' : ''}`}
              >
                <Icone size={12} strokeWidth={2.6} aria-hidden="true" />
                {exigence.libelle}
                <span className="ui-visually-hidden"> : {titre}{exigence.detail ? `, ${exigence.detail}` : ''}</span>
              </span>
            );
          })}
        </span>
      )}
      {agent.attentions?.length > 0 && (
        <span className="passation-attentions">
          {agent.attentions.map((attention) => (
            <span key={attention}><AlertTriangle size={13} aria-hidden="true" />{attention}</span>
          ))}
        </span>
      )}
    </>
  );
}

/** Un agent possible pour le poste : photo, rang, atouts, exigences, points d'attention. */
function CarteCandidat({ agent, rang, choisi, groupe, onChoisir }) {
  return (
    <label className={`passation-candidat${choisi ? ' is-choisi' : ''}`} data-candidat={agent.id}>
      <input
        type="radio"
        className="ui-visually-hidden"
        name={groupe}
        checked={choisi}
        onChange={() => onChoisir(agent)}
      />
      <span className="passation-photo" aria-hidden="true">
        <PersonPhoto src={getEmployeePhotoUrl(agent.photo)} alt="" initials={getEmployeeInitials(agent)} />
        {rang && <span className="passation-rang">{rang}</span>}
      </span>
      <span className="passation-candidat-texte">
        <strong>{agent.prenom} {agent.nom}</strong>
        <small>{[agent.poste, agent.service].filter(Boolean).join(' · ')}</small>
        {agent.raisons?.length > 0 && (
          <span className="passation-raisons">
            {agent.raisons.map((raison) => <span key={raison}>{raison}</span>)}
          </span>
        )}
        <BilanCandidat agent={agent} />
      </span>
      <Link className="passation-profil" to={`/agents/${agent.id}`}>Profil</Link>
    </label>
  );
}

/** Choisir n'importe quel agent, par son nom ou son matricule. */
function ChoixLibre({ exclus, onChoisir, disabled }) {
  const [agents, setAgents] = useState(null);
  const [saisie, setSaisie] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const champ = useId();

  function charger() {
    if (agents) return;
    getAgents().then(setAgents).catch(() => setAgents([]));
  }

  const normaliser = (texte) => String(texte || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const recherche = normaliser(saisie.trim());
  const resultats = recherche.length < 2 || !agents ? [] : agents
    .filter((agent) => !exclus.has(agent.id) && !agent.date_retraite)
    .filter((agent) => normaliser(`${agent.prenom} ${agent.nom} ${agent.matricule}`).includes(recherche))
    .slice(0, 6);

  return (
    <div className="passation-libre">
      <label htmlFor={champ} className="passation-libre-titre">
        <Search size={15} aria-hidden="true" /> Choisir un autre agent
      </label>
      <input
        id={champ}
        type="search"
        value={saisie}
        placeholder="Nom, prénom ou matricule"
        autoComplete="off"
        disabled={disabled}
        onFocus={() => { charger(); setOuvert(true); }}
        onChange={(event) => { charger(); setSaisie(event.target.value); setOuvert(true); }}
      />
      {ouvert && resultats.length > 0 && (
        <ul className="passation-libre-resultats">
          {resultats.map((agent) => (
            <li key={agent.id}>
              <button
                type="button"
                onClick={() => { onChoisir(agent.id); setSaisie(''); setOuvert(false); }}
              >
                <strong>{agent.prenom} {agent.nom}</strong>
                <small>{[agent.matricule, agent.poste, agent.service].filter(Boolean).join(' · ')}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      {ouvert && recherche.length >= 2 && agents && resultats.length === 0 && (
        <p className="passation-aide">Aucun agent ne correspond.</p>
      )}
    </div>
  );
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
  const navigate = useNavigate();
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
  // Un agent choisi hors des recommandations, avec son analyse pour ce poste.
  const [horsListe, setHorsListe] = useState(null);
  const [analyseEnCours, setAnalyseEnCours] = useState(false);
  const partant = poste.titulaires_partants?.[0];

  useEffect(() => {
    let actif = true;
    getCandidats(poste.poste_id)
      .then((liste) => {
        if (!actif) return;
        setCandidats({ liste, erreur: '' });
        setChoix((courant) => courant || liste[0] || null);
        // L'agent déjà choisi n'est pas parmi les recommandés : on charge son analyse.
        if (plan && !liste.some((agent) => agent.id === plan.successeur_id)) {
          analyserCandidat(poste.poste_id, plan.successeur_id)
            .then((analyse) => { if (actif) setHorsListe(analyse); })
            .catch(() => {});
        }
      })
      .catch((err) => { if (actif) setCandidats({ liste: [], erreur: err?.message || 'Impossible de proposer des candidats.' }); });
    return () => { actif = false; };
  }, [poste.poste_id, plan]);

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
        : `${choix.prenom} ${choix.nom} est choisi·e pour le poste ${poste.poste}.`);
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
      toast.succes(`Plus aucun agent n’est choisi pour le poste ${poste.poste}.`);
      onChange();
      onClose();
    } catch (err) {
      toast.erreur(err?.message || 'Le choix n’a pas pu être retiré.');
      setEnvoi(false);
    }
  }

  const choisi = candidats.liste?.find((agent) => agent.id === choix?.id)
    || (horsListe?.id === choix?.id ? horsListe : null);

  /** Un agent choisi librement : son analyse pour ce poste, puis il devient le choix. */
  async function choisirLibrement(employeId) {
    const recommande = candidats.liste?.find((agent) => agent.id === employeId);
    if (recommande) {
      // Déjà parmi les recommandés : on le sélectionne et on montre sa carte.
      setChoix(recommande);
      requestAnimationFrame(() => {
        document.querySelector(`[data-candidat="${employeId}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return;
    }
    setAnalyseEnCours(true);
    try {
      const analyse = await analyserCandidat(poste.poste_id, employeId);
      setHorsListe(analyse);
      setChoix(analyse);
      requestAnimationFrame(() => {
        document.querySelector(`[data-candidat="${employeId}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    } catch (err) {
      toast.erreur(err?.message || 'Cet agent n’a pas pu être analysé.');
    } finally {
      setAnalyseEnCours(false);
    }
  }
  // La demande de mutation se prépare pour l'agent déjà désigné (pas pour un choix pas encore enregistré).
  const designeEnregistre = Boolean(plan && choix && plan.successeur_id === choix.id);

  /** Ouvre une demande de mutation préremplie : rien n'est créé avant « Enregistrer ». */
  function preparerMutation() {
    const champs = {
      directionSouhaiteeId: poste.direction_id,
      serviceSouhaiteId: poste.service_id,
      posteSouhaiteId: poste.poste_id,
      motif: libre
        ? `Occuper le poste libre de ${poste.poste}${poste.service ? `, ${poste.service}` : ''}.`
        : `Préparer la relève de ${partant?.nom || 'l’actuel titulaire'} au poste de ${poste.poste}${poste.service ? `, ${poste.service}` : ''}.`,
    };
    const fields = Object.fromEntries(Object.entries(champs).filter(([, valeur]) => valeur !== null && valeur !== undefined));
    navigate('/documents/nouveau', {
      state: {
        demandeCarriere: { typeCode: 'MUTATION', employeId: choix.id, origine: 'postes' },
        bandyPrefill: { fields },
      },
    });
  }

  return (
    <div
      className="rf-overlay"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !envoi) onClose(); }}
    >
      <form className="rf-card passation" role="dialog" aria-modal="true" aria-labelledby={`${id}-titre`} onSubmit={enregistrer}>
        <header className="passation-tete">
          <div>
            <p className="rf-eyebrow">{libre ? 'Poste libre' : 'Poste qui se libère'}</p>
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
            <span />2 · Confirmer et suivre
          </li>
        </ol>

        {etape === 1 && (
          <fieldset className="passation-candidats">
            <legend className="ui-visually-hidden">Agents possibles</legend>
            {candidats.erreur && <p className="rf-error">{candidats.erreur}</p>}
            {!candidats.liste && <p className="rf-note" role="status">Recherche des agents recommandés…</p>}
            {horsListe && (
              <>
                <p className="passation-section">Votre choix</p>
                <CarteCandidat agent={horsListe} choisi={choix?.id === horsListe.id} groupe={`${id}-candidat`} onChoisir={setChoix} />
              </>
            )}
            {candidats.liste?.length > 0 && (
              <p className="passation-section">Recommandés par SYGPERS</p>
            )}
            {candidats.liste?.length === 0 && (
              <p className="rf-note">Aucun agent à recommander : choisissez-en un ci-dessous.</p>
            )}
            {candidats.liste?.map((agent, rang) => (
              <CarteCandidat key={agent.id} agent={agent} rang={rang + 1} choisi={choix?.id === agent.id}
                groupe={`${id}-candidat`} onChoisir={setChoix} />
            ))}
            {candidats.liste?.length > 0 && (
              <p className="passation-aide">
                Classés selon : a déjà occupé ce poste, même service ou direction, exigences du poste, catégorie,
                diplôme et compétences{libre ? '' : ' en commun avec le titulaire'}, ancienneté. Une recommandation seulement :
                vous pouvez choisir n’importe quel agent.
              </p>
            )}
            <ChoixLibre
              exclus={new Set((poste.titulaires_partants || []).map((titulaire) => titulaire.id))}
              onChoisir={choisirLibrement}
              disabled={analyseEnCours || envoi}
            />
            {analyseEnCours && <p className="rf-note" role="status">Analyse de cet agent pour le poste…</p>}
          </fieldset>
        )}

        {etape === 2 && choix && (
          <div className="passation-suivi">
            <div className="passation-choisi">
              <span className="passation-photo" aria-hidden="true">
                <PersonPhoto src={getEmployeePhotoUrl(choisi?.photo)} alt="" initials={getEmployeeInitials(choix)} />
              </span>
              <span>
                <small>{libre ? 'Agent choisi' : 'Successeur choisi'}</small>
                <LienAgent id={choix.id} nom={`${choix.prenom || ''} ${choix.nom || ''}`.trim()} variante="texte" />
                {choisi?.poste ? <small>{choisi.poste} · {choisi.service}</small> : null}
              </span>
            </div>
            {choisi && (choisi.exigences?.length > 0 || choisi.attentions?.length > 0) && (
              <div className="passation-bilan"><BilanCandidat agent={choisi} /></div>
            )}
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
            {designeEnregistre ? (
              <div className="passation-suite">
                <span className="passation-suite-icone" aria-hidden="true"><FileSignature size={20} /></span>
                <span className="passation-suite-texte">
                  <strong>Étape suivante : la demande de mutation</strong>
                  <small>
                    Elle suit le circuit habituel : lettre signée, réponse, application. Quand {choix.prenom} prendra
                    le poste, ce plan se fermera tout seul.
                  </small>
                </span>
                <button type="button" className="rf-btn rf-btn-sm rf-btn-primary" onClick={preparerMutation} disabled={envoi}>
                  Préparer la demande <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <p className="passation-aide">
                Choisir ne mute personne : c’est un plan. La demande de mutation se prépare ensuite, depuis cette fenêtre.
              </p>
            )}
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
                {plan ? 'Enregistrer' : `Choisir ${choix?.prenom || ''}`.trim()}
              </button>
            </>
          )}
        </footer>
      </form>
    </div>
  );
}
