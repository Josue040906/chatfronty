import { useCallback, useEffect, useState } from 'react';
import { Mail, MailCheck } from 'lucide-react';
import { getMessagesAgents, getModeEnvoi } from '../../api/messagesAgents';
import { useMessageAgent } from '../../components/messages/messageAgentContext';
import { STATUTS_MESSAGE, TYPES_MESSAGE } from '../../utils/messagesAgents';

function quand(valeur) {
  if (!valeur) return '';
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? String(valeur)
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/**
 * Les e-mails aux agents : ceux qui attendent une décision (préparés par les
 * événements de carrière, ou en échec), et l'historique de ce qui a été envoyé
 * ou écarté, par qui et quand.
 */
export default function MessagesPage() {
  const { ouvrir } = useMessageAgent();
  const [onglet, setOnglet] = useState('attente');
  const [messages, setMessages] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [mode, setMode] = useState(null);

  const charger = useCallback(async () => {
    setErreur('');
    try {
      setMessages(await getMessagesAgents());
    } catch (err) {
      setErreur(err?.message || 'Impossible de charger les messages.');
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

  const enAttente = messages.filter((message) => ['PROPOSE', 'ECHEC'].includes(message.statut));
  const historique = messages.filter((message) => ['ENVOYE', 'ECARTE'].includes(message.statut));
  const liste = onglet === 'attente' ? enAttente : historique;

  return (
    <div className="rf-page">
      <header className="rf-head">
        <div>
          <p className="rf-eyebrow">Communication</p>
          <h1 className="rf-title">Messages aux agents</h1>
          <p className="rf-lead">
            Chaque événement de carrière prépare un e-mail pour l’agent concerné. Rien ne part sans
            votre relecture : envoyez-le, modifiez-le ou écartez-le.
          </p>
        </div>
      </header>

      {mode?.mode === 'JOURNAL' && (
        <p className="message-mode">
          Mode journal : les envois sont notés mais aucun e-mail ne part tant que Brevo n’est pas configuré.
        </p>
      )}

      <div className="rf-chips" role="tablist" aria-label="Messages affichés">
        <button type="button" role="tab" className="rf-chip" aria-selected={onglet === 'attente'} aria-pressed={onglet === 'attente'} onClick={() => setOnglet('attente')}>
          À envoyer<span>{enAttente.length}</span>
        </button>
        <button type="button" role="tab" className="rf-chip" aria-selected={onglet === 'historique'} aria-pressed={onglet === 'historique'} onClick={() => setOnglet('historique')}>
          Historique<span>{historique.length}</span>
        </button>
      </div>

      {chargement && <p className="rf-note" role="status">Chargement…</p>}
      {erreur && <p className="rf-error" role="alert">{erreur}</p>}
      {!chargement && !erreur && liste.length === 0 && (
        <div className="rf-card documents-empty">
          <MailCheck size={40} />
          <h3>{onglet === 'attente' ? 'Aucun e-mail en attente' : 'Aucun e-mail traité pour l’instant'}</h3>
          <p>
            {onglet === 'attente'
              ? 'Les prochains événements de carrière en prépareront.'
              : 'Les e-mails envoyés ou écartés apparaîtront ici.'}
          </p>
        </div>
      )}

      <div className="messages-liste">
        {liste.map((message) => {
          const nom = [message.prenom, message.nom].filter(Boolean).join(' ');
          return (
            <div className="rf-card message-carte" key={message.id}>
              <span className="rf-ico"><Mail size={18} /></span>
              <div className="message-carte-texte">
                <strong>{message.sujet}</strong>
                <small>
                  {TYPES_MESSAGE[message.type] || message.type} · {nom} ({message.matricule})
                  {message.email_agent ? '' : ' · sans adresse e-mail'}
                </small>
                <small>
                  {message.traite_le
                    ? `${STATUTS_MESSAGE[message.statut]} le ${quand(message.traite_le)}${message.traite_par_nom ? ` par ${message.traite_par_nom}` : ''}${message.reference_fournisseur === 'JOURNAL' ? ' (mode journal)' : ''}`
                    : `Préparé le ${quand(message.cree_le)}`}
                  {message.statut === 'ECHEC' && message.erreur ? ` · ${message.erreur}` : ''}
                </small>
              </div>
              <span className={`message-carte-statut is-${String(message.statut).toLowerCase()}`}>
                {STATUTS_MESSAGE[message.statut] || message.statut}
              </span>
              <button type="button" className={`rf-btn${onglet === 'attente' ? ' rf-btn-primary' : ''}`} onClick={() => ouvrir(message)}>
                {onglet === 'attente' ? 'Relire et envoyer' : 'Voir'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
