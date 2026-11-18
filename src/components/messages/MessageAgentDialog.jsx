import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, PenLine, Send, X } from 'lucide-react';
import { ecarterMessageAgent, envoyerMessageAgent, getModeEnvoi } from '../../api/messagesAgents';
import { familleMessage, quandRelatif, STATUTS_MESSAGE, TYPES_MESSAGE } from '../../utils/messagesAgents';
import LienAgent from '../agents/LienAgent';

let modeEnCache = null;

/**
 * Relire un e-mail préparé pour un agent, dans un volet qui glisse depuis la
 * droite et se lit comme une lettre. Le texte ne devient modifiable que sur
 * demande. Rien ne part sans le clic « Envoyer ».
 * position / total : « 1 sur 3 » ; suiteDisponible : le bouton enchaîne sur le suivant.
 */
export default function MessageAgentDialog({ message, onClose, onDone, position, total, suiteDisponible = false }) {
  const id = useId();
  const [sujet, setSujet] = useState(message.sujet || '');
  const [corps, setCorps] = useState(message.corps || '');
  // Un e-mail rédigé depuis une notification est à compléter : il s'ouvre en modification.
  const aCompleter = (texte) => texte.includes('[Complétez');
  const [edition, setEdition] = useState(() => aCompleter(message.corps || ''));
  const [mode, setMode] = useState(modeEnCache);
  const [envoi, setEnvoi] = useState({ running: '', error: '' });
  const nom = [message.prenom, message.nom].filter(Boolean).join(' ');
  const adresse = message.email_agent;
  const dejaTraite = !['PROPOSE', 'ECHEC'].includes(message.statut);
  const { ton, Icone } = familleMessage(message.type);

  useEffect(() => {
    if (modeEnCache) return;
    getModeEnvoi().then((resultat) => { modeEnCache = resultat; setMode(resultat); }).catch(() => {});
  }, []);

  useEffect(() => {
    function echap(event) { if (event.key === 'Escape' && !envoi.running) onClose(); }
    document.addEventListener('keydown', echap);
    return () => document.removeEventListener('keydown', echap);
  }, [envoi.running, onClose]);

  async function envoyer(event) {
    event.preventDefault();
    if (aCompleter(corps)) {
      setEdition(true);
      setEnvoi({ running: '', error: 'Complétez le message (remplacez le texte entre crochets) avant de l’envoyer.' });
      return;
    }
    setEnvoi({ running: 'envoyer', error: '' });
    try {
      const resultat = await envoyerMessageAgent(message.id, { sujet, corps });
      onDone(resultat, mode?.mode === 'JOURNAL'
        ? `Mode essai : l’e-mail à ${nom} est noté comme envoyé, sans être parti.`
        : `E-mail envoyé à ${nom} (${adresse}).`);
    } catch (err) {
      setEnvoi({ running: '', error: err?.message || 'L’e-mail n’a pas pu être envoyé.' });
    }
  }

  async function ecarter() {
    setEnvoi({ running: 'ecarter', error: '' });
    try {
      await ecarterMessageAgent(message.id);
      onDone({ ...message, statut: 'ECARTE' }, `E-mail à ${nom} écarté : il ne sera pas envoyé.`);
    } catch (err) {
      setEnvoi({ running: '', error: err?.message || 'Le message n’a pas pu être écarté.' });
    }
  }

  return (
    <div
      className="rf-overlay message-volet-fond"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !envoi.running) onClose(); }}
    >
      <form className="message-volet" role="dialog" aria-modal="true" aria-labelledby={`${id}-titre`} onSubmit={envoyer}>
        <header className="message-volet-tete">
          <span className={`courriel-icone is-${ton}`} aria-hidden="true"><Icone size={18} /></span>
          <p className="message-volet-type">
            {TYPES_MESSAGE[message.type] || 'E-mail'}
            {position && total > 1 ? <span> · {position} sur {total}</span> : null}
          </p>
          <button type="button" className="rf-icon-btn" aria-label="Fermer" disabled={Boolean(envoi.running)} onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        <div className="message-lettre">
          <p className={`message-lettre-a${adresse ? '' : ' is-manquant'}`}>
            <span className="message-lettre-etiquette">À</span>
            <LienAgent id={message.employe_id} nom={nom} onNavigate={onClose} />
            {adresse
              ? <span className="message-lettre-adresse">{adresse}</span>
              : (
                <span className="message-lettre-adresse">
                  pas d’adresse e-mail ·{' '}
                  <Link to={`/agents/${message.employe_id}`} onClick={onClose}>l’ajouter sur sa fiche</Link>
                </span>
              )}
          </p>

          {edition ? (
            <>
              <label className="rf-field">
                <span className="rf-label">Sujet</span>
                <input value={sujet} onChange={(event) => setSujet(event.target.value)} maxLength={200} required />
              </label>
              <label className="rf-field message-lettre-champ">
                <span className="rf-label">Message</span>
                <textarea value={corps} onChange={(event) => setCorps(event.target.value)} rows={12} maxLength={10000} required />
              </label>
            </>
          ) : (
            <>
              <h2 id={`${id}-titre`} className="message-lettre-sujet">{sujet}</h2>
              <div className="message-lettre-corps">{corps}</div>
              {!dejaTraite && (
                <button type="button" className="message-lettre-modifier" onClick={() => setEdition(true)}>
                  <PenLine size={14} aria-hidden="true" /> Modifier le texte
                </button>
              )}
            </>
          )}
          {edition && <h2 id={`${id}-titre`} className="ui-visually-hidden">{sujet}</h2>}
        </div>

        {mode?.mode === 'JOURNAL' && !dejaTraite && (
          <p className="message-mode">
            <Info size={15} aria-hidden="true" />
            Mode essai : l’envoi sera noté, mais aucun e-mail ne partira tant que Brevo n’est pas configuré.
          </p>
        )}
        {message.statut === 'ECHEC' && message.erreur && (
          <p className="rf-error">Dernier essai refusé : {message.erreur}</p>
        )}
        {envoi.error && <p className="rf-error" role="alert">{envoi.error}</p>}

        <footer className="message-volet-pied">
          {dejaTraite ? (
            <>
              <span className={`statut-pastille is-${message.statut === 'ENVOYE' ? 'libre' : 'adecider'}`}>
                <span className="statut-pastille-texte">
                  {STATUTS_MESSAGE[message.statut]}{message.traite_le ? ` ${quandRelatif(message.traite_le)}` : ''}
                  {message.traite_par_nom ? ` par ${message.traite_par_nom}` : ''}
                </span>
              </span>
              <button type="button" className="rf-btn" onClick={onClose}>Fermer</button>
            </>
          ) : (
            <>
              <button type="button" className="rf-btn rf-btn-ghost" disabled={Boolean(envoi.running)} onClick={ecarter}>
                {envoi.running === 'ecarter' ? 'Écart…' : 'Ne pas envoyer'}
              </button>
              <span>
                <button type="button" className="rf-btn" disabled={Boolean(envoi.running)} onClick={onClose}>Plus tard</button>
                <button type="submit" className="rf-btn rf-btn-primary" disabled={Boolean(envoi.running) || !adresse}>
                  <Send size={16} />
                  {envoi.running === 'envoyer' ? 'Envoi…' : suiteDisponible ? 'Envoyer et passer au suivant' : 'Envoyer'}
                </button>
              </span>
            </>
          )}
        </footer>
      </form>
    </div>
  );
}
