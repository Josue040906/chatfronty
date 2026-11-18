import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { getMessagesAgents } from '../../api/messagesAgents';
import { familleMessage, quandRelatif, TYPES_MESSAGE } from '../../utils/messagesAgents';
import { useMessageAgent } from './messageAgentContext';

const ETATS = {
  PROPOSE: { ton: 'bientot', texte: (m) => `À relire · préparé ${quandRelatif(m.cree_le)}` },
  ECHEC: { ton: 'urgent', texte: () => 'Envoi refusé' },
  ENVOYE: { ton: 'libre', texte: (m) => `Envoyé ${quandRelatif(m.traite_le)}${m.traite_par_nom ? ` par ${m.traite_par_nom}` : ''}` },
  ECARTE: { ton: 'adecider', texte: (m) => `Écarté ${quandRelatif(m.traite_le)}` },
};

/**
 * Les e-mails à cet agent : ceux qui attendent une relecture, ceux envoyés ou
 * écartés, et par qui. Chaque ligne rouvre l'e-mail dans le volet de lecture.
 */
export default function EmailsAgent({ agentId }) {
  const { ouvrir } = useMessageAgent();
  const [messages, setMessages] = useState(null);
  const [tout, setTout] = useState(false);

  useEffect(() => {
    let actif = true;
    const charger = () => getMessagesAgents({ employeId: agentId })
      .then((liste) => { if (actif) setMessages(liste); })
      .catch(() => { if (actif) setMessages([]); });
    charger();
    window.addEventListener('messages-agents:change', charger);
    return () => {
      actif = false;
      window.removeEventListener('messages-agents:change', charger);
    };
  }, [agentId]);

  if (!messages) return null;
  const visibles = tout ? messages : messages.slice(0, 4);

  return (
    <section className="rf-card profil-section emails-agent" aria-labelledby={`emails-agent-${agentId}`}>
      <h2 id={`emails-agent-${agentId}`} className="profil-section-titre">
        <span className="rf-ico"><Mail size={18} /></span>
        E-mails à l’agent
      </h2>
      {messages.length === 0 ? (
        <p className="rf-note">
          Aucun e-mail pour l’instant. Les situations de carrière de l’agent (ancienneté, demande, retraite…) arrivent
          dans les notifications, avec un bouton pour le prévenir.
        </p>
      ) : (
        <ul className="emails-agent-liste">
          {visibles.map((message) => {
            const { ton, Icone } = familleMessage(message.type);
            const etat = ETATS[message.statut] || ETATS.PROPOSE;
            return (
              <li key={message.id}>
                <button type="button" onClick={() => ouvrir(message)}>
                  <span className={`courriel-icone is-${ton}`} aria-hidden="true"><Icone size={16} /></span>
                  <span className="emails-agent-texte">
                    <strong>{message.sujet}</strong>
                    <small>{TYPES_MESSAGE[message.type] || 'E-mail'}</small>
                  </span>
                  <span className={`statut-pastille is-${etat.ton}`}>
                    <span className="statut-pastille-texte">{etat.texte(message)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {messages.length > 4 && (
        <button type="button" className="emails-agent-tout" onClick={() => setTout((valeur) => !valeur)}>
          {tout ? 'Voir moins' : `Voir les ${messages.length} e-mails`}
        </button>
      )}
    </section>
  );
}
