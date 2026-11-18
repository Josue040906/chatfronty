import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, HelpCircle, Info, MailCheck } from 'lucide-react';
import { getMessagesAgents, getModeEnvoi } from '../../api/messagesAgents';
import LienAgent from '../../components/agents/LienAgent';
import MessageAgentDialog from '../../components/messages/MessageAgentDialog';
import { Segmented } from '../../components/ui';
import { useToast } from '../../components/ui/toastContext';
import { familleMessage, quandRelatif, TYPES_MESSAGE } from '../../utils/messagesAgents';

const ONGLETS = {
  relire: ['PROPOSE', 'ECHEC'],
  envoyes: ['ENVOYE'],
  ecartes: ['ECARTE'],
};

const VIDES = {
  relire: { titre: 'Tout est relu', texte: 'Les prochains événements de carrière prépareront de nouveaux e-mails.' },
  envoyes: { titre: 'Aucun e-mail envoyé pour l’instant', texte: 'Les e-mails envoyés apparaîtront ici, avec la date et qui les a envoyés.' },
  ecartes: { titre: 'Aucun e-mail écarté', texte: 'Un e-mail que vous choisissez de ne pas envoyer apparaîtra ici.' },
};

/** Ce qu'on dit d'un e-mail dans la liste : quand il a été préparé, ou ce qu'il est devenu. */
function etatCourriel(message) {
  if (message.statut === 'ECHEC') return { ton: 'urgent', texte: 'Envoi refusé' };
  if (message.statut === 'ENVOYE') {
    return {
      ton: 'libre',
      texte: `Envoyé ${quandRelatif(message.traite_le)}${message.reference_fournisseur === 'JOURNAL' ? ' (essai)' : ''}`,
    };
  }
  if (message.statut === 'ECARTE') return { ton: 'adecider', texte: `Écarté ${quandRelatif(message.traite_le)}` };
  return { ton: 'bientot', texte: `Préparé ${quandRelatif(message.cree_le)}` };
}

/**
 * E-mails aux agents : chaque événement de carrière prépare un e-mail pour
 * l'agent concerné ; on le relit dans un volet, on l'envoie ou on l'écarte.
 * Une phrase pour comprendre, une liste pour agir, les explications sur demande.
 */
export default function MessagesPage() {
  const toast = useToast();
  const [onglet, setOnglet] = useState('relire');
  const [messages, setMessages] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [mode, setMode] = useState(null);
  const [aide, setAide] = useState(false);
  const [ouvert, setOuvert] = useState(null);

  const charger = useCallback(async () => {
    setErreur('');
    try {
      const liste = await getMessagesAgents();
      setMessages(liste);
      return liste;
    } catch (err) {
      setErreur(err?.message || 'Impossible de charger les e-mails.');
      return null;
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
    getModeEnvoi().then(setMode).catch(() => {});
    const rafraichir = () => { void charger(); };
    window.addEventListener('messages-agents:change', rafraichir);
    return () => window.removeEventListener('messages-agents:change', rafraichir);
  }, [charger]);

  const parOnglet = (cle) => messages.filter((message) => ONGLETS[cle].includes(message.statut));
  const aRelire = parOnglet('relire');
  const liste = parOnglet(onglet);
  const onglets = [
    { value: 'relire', label: `À relire · ${aRelire.length}` },
    { value: 'envoyes', label: `Envoyés · ${parOnglet('envoyes').length}` },
    { value: 'ecartes', label: `Écartés · ${parOnglet('ecartes').length}` },
  ];

  const positionOuvert = ouvert ? aRelire.findIndex((message) => message.id === ouvert.id) : -1;
  const suivant = positionOuvert >= 0 ? aRelire.find((message, index) => index !== positionOuvert) : null;

  async function apresDecision(texte) {
    toast.succes(texte);
    // Prévient la cloche et le menu (pastille du nombre d'e-mails à relire).
    window.dispatchEvent(new CustomEvent('messages-agents:change'));
    const nouvelleListe = await charger();
    const restants = (nouvelleListe || []).filter((message) => ONGLETS.relire.includes(message.statut));
    // Depuis la liste « À relire », on enchaîne sur l'e-mail suivant.
    const prochain = positionOuvert >= 0
      ? restants[Math.min(positionOuvert, restants.length - 1)]
      : null;
    setOuvert(prochain || null);
  }

  return (
    <div className="rf-page courriel-page">
      <header className="depart-tete">
        <div>
          <p className="rf-eyebrow">Courrier</p>
          <h1 className="rf-title">E-mails aux agents</h1>
        </div>
        <div className="depart-outils">
          {mode?.mode === 'JOURNAL' && (
            <span className="statut-pastille is-bientot" title="Les envois sont notés, mais aucun e-mail ne part tant que Brevo n’est pas configuré.">
              <Info size={14} aria-hidden="true" />
              <span className="statut-pastille-texte">Mode essai : rien ne part</span>
            </span>
          )}
          <button
            type="button"
            className={`depart-aide-btn${aide ? ' is-ouvert' : ''}`}
            aria-expanded={aide}
            aria-controls="courriel-aide"
            onClick={() => setAide((valeur) => !valeur)}
            title="Comment ça marche"
          >
            <HelpCircle size={18} />
            <span className="ui-visually-hidden">Comment ça marche</span>
          </button>
        </div>
      </header>

      {aide && (
        <div id="courriel-aide" className="depart-aide">
          <p><strong>Un événement</strong> : une mutation, un avancement, une demande acceptée ou refusée, une retraite qui approche…</p>
          <p><strong>Un e-mail rédigé</strong> : SYGPERS prépare aussitôt un e-mail pour l’agent concerné.</p>
          <p><strong>Vous relisez</strong> : rien ne part sans vous. Vous pouvez modifier le texte, l’envoyer, ou choisir de ne pas l’envoyer.</p>
        </div>
      )}

      {erreur && <p className="rf-error" role="alert">{erreur}</p>}
      {chargement && <p className="rf-note" role="status">Chargement…</p>}

      {!chargement && !erreur && (
        <p className="depart-resume">
          {aRelire.length > 0
            ? <><em>{aRelire.length} e-mail{aRelire.length > 1 ? 's' : ''}</em> {aRelire.length > 1 ? 'attendent' : 'attend'} votre relecture.</>
            : 'Tout est relu : aucun e-mail n’attend votre décision.'}
        </p>
      )}

      {!chargement && !erreur && (
        <>
          <div className="depart-barre">
            <Segmented label="E-mails affichés" options={onglets} value={onglet} onChange={setOnglet} className="depart-vues" />
          </div>

          {liste.length === 0 ? (
            <div className="rf-card documents-empty">
              <MailCheck size={40} />
              <h3>{VIDES[onglet].titre}</h3>
              <p>{VIDES[onglet].texte}</p>
            </div>
          ) : (
            <ul className="rf-card courriel-liste">
              {liste.map((message) => {
                const { ton, Icone } = familleMessage(message.type);
                const etat = etatCourriel(message);
                const nom = [message.prenom, message.nom].filter(Boolean).join(' ');
                const aTraiter = onglet === 'relire';
                return (
                  <li key={message.id} className={`courriel${message.statut === 'ECHEC' ? ' is-urgent' : ''}`}>
                    <span className={`courriel-icone is-${ton}`} aria-hidden="true"><Icone size={19} /></span>
                    <span className="courriel-texte">
                      <strong>{message.sujet}</strong>
                      <span className="courriel-meta">
                        <LienAgent id={message.employe_id} nom={nom} />
                        <span>{TYPES_MESSAGE[message.type] || message.type}</span>
                        {!message.email_agent && <span className="courriel-sans-adresse">sans adresse e-mail</span>}
                      </span>
                    </span>
                    <span className={`statut-pastille is-${etat.ton}`} title={message.statut === 'ECHEC' ? message.erreur : undefined}>
                      <span className="statut-pastille-texte">{etat.texte}</span>
                    </span>
                    <button
                      type="button"
                      className={`depart-action ${aTraiter ? 'is-preparer' : 'is-suivi'}`}
                      onClick={() => setOuvert(message)}
                      aria-label={`${aTraiter ? 'Relire' : 'Voir'} l’e-mail à ${nom}`}
                    >
                      {aTraiter ? 'Relire' : 'Voir'}
                      <ChevronRight className="depart-action-fleche" size={15} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {ouvert && (
        <MessageAgentDialog
          key={ouvert.id}
          message={ouvert}
          position={positionOuvert >= 0 ? positionOuvert + 1 : null}
          total={aRelire.length}
          suiteDisponible={Boolean(suivant)}
          onClose={() => setOuvert(null)}
          onDone={(_, texte) => { void apresDecision(texte); }}
        />
      )}
    </div>
  );
}
