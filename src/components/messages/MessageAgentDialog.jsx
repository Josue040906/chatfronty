import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Mail, Send, X } from 'lucide-react';
import { ecarterMessageAgent, envoyerMessageAgent, getModeEnvoi } from '../../api/messagesAgents';
import { TYPES_MESSAGE } from '../../utils/messagesAgents';


let modeEnCache = null;

/**
 * Relire un brouillon d'e-mail et décider : l'envoyer (sujet et message
 * modifiables), l'écarter, ou y revenir plus tard. Rien ne part sans ce clic.
 */
export default function MessageAgentDialog({ message, onClose, onDone }) {
  const id = useId();
  const [sujet, setSujet] = useState(message.sujet || '');
  const [corps, setCorps] = useState(message.corps || '');
  const [mode, setMode] = useState(modeEnCache);
  const [envoi, setEnvoi] = useState({ running: '', error: '' });
  const nom = [message.prenom, message.nom].filter(Boolean).join(' ');
  const adresse = message.email_agent;
  const dejaTraite = !['PROPOSE', 'ECHEC'].includes(message.statut);

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
    setEnvoi({ running: 'envoyer', error: '' });
    try {
      const resultat = await envoyerMessageAgent(message.id, { sujet, corps });
      onDone(resultat, mode?.mode === 'JOURNAL'
        ? `Mode journal : l’e-mail à ${nom} est noté comme envoyé, sans être parti.`
        : `E-mail envoyé à ${nom} (${adresse}).`);
    } catch (err) {
      setEnvoi({ running: '', error: err?.message || 'L’e-mail n’a pas pu être envoyé.' });
    }
  }

  async function ecarter() {
    setEnvoi({ running: 'ecarter', error: '' });
    try {
      await ecarterMessageAgent(message.id);
      onDone({ ...message, statut: 'ECARTE' }, `Message à ${nom} écarté : il ne sera pas envoyé.`);
    } catch (err) {
      setEnvoi({ running: '', error: err?.message || 'Le message n’a pas pu être écarté.' });
    }
  }

  return (
    <div
      className="rf-overlay"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !envoi.running) onClose(); }}
    >
      <form className="rf-card message-dialogue" role="dialog" aria-modal="true" aria-labelledby={`${id}-titre`} onSubmit={envoyer}>
        <header className="message-dialogue-tete">
          <span className="rf-ico"><Mail size={18} /></span>
          <div>
            <p className="rf-eyebrow">{TYPES_MESSAGE[message.type] || 'Message'}</p>
            <h2 id={`${id}-titre`}>E-mail à {nom || 'l’agent'}</h2>
          </div>
          <button type="button" className="rf-icon-btn" aria-label="Fermer" disabled={Boolean(envoi.running)} onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        <p className={`message-destinataire${adresse ? '' : ' is-manquant'}`}>
          <strong>À :</strong>{' '}
          {adresse
            ? `${nom} <${adresse}>`
            : (
              <>
                {nom} n’a pas d’adresse e-mail.{' '}
                <Link to={`/agents/${message.employe_id}`} onClick={onClose}>Ajouter son e-mail sur sa fiche</Link>
              </>
            )}
        </p>

        {mode?.mode === 'JOURNAL' && !dejaTraite && (
          <p className="message-mode">
            <Info size={15} aria-hidden="true" />
            Mode journal : l’envoi sera noté, mais aucun e-mail ne partira tant que Brevo n’est pas configuré.
          </p>
        )}
        {message.statut === 'ECHEC' && message.erreur && (
          <p className="rf-error">Dernier essai refusé : {message.erreur}</p>
        )}

        <label className="rf-field">
          <span className="rf-label">Sujet</span>
          <input value={sujet} onChange={(event) => setSujet(event.target.value)} maxLength={200} required disabled={dejaTraite} />
        </label>
        <label className="rf-field">
          <span className="rf-label">Message</span>
          <textarea value={corps} onChange={(event) => setCorps(event.target.value)} rows={12} maxLength={10000} required disabled={dejaTraite} />
        </label>

        {envoi.error && <p className="rf-error" role="alert">{envoi.error}</p>}

        {!dejaTraite && (
          <footer className="message-dialogue-pied">
            <button type="button" className="rf-btn rf-btn-ghost" disabled={Boolean(envoi.running)} onClick={ecarter}>
              {envoi.running === 'ecarter' ? 'Écart…' : 'Ne pas envoyer'}
            </button>
            <span>
              <button type="button" className="rf-btn" disabled={Boolean(envoi.running)} onClick={onClose}>Plus tard</button>
              <button type="submit" className="rf-btn rf-btn-primary" disabled={Boolean(envoi.running) || !adresse}>
                <Send size={16} />
                {envoi.running === 'envoyer' ? 'Envoi…' : 'Envoyer'}
              </button>
            </span>
          </footer>
        )}
      </form>
    </div>
  );
}
