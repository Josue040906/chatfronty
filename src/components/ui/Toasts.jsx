import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { ToastContext } from './toastContext';

/**
 * Les messages qui rendent compte d'une action (« Demande appliquée », « Le
 * poste est complet »…) s'affichent en haut de l'écran, à part de la page :
 * un succès disparaît seul, une erreur reste jusqu'à ce qu'on la ferme.
 * Les erreurs de saisie restent près de leur champ, et l'état d'une page
 * (chargement impossible, demande bloquée) reste sur la page.
 */
const DUREE_SUCCES = 5000;
// Un message qui propose une suite (« Prévenir Hery par e-mail ») reste plus longtemps.
const DUREE_AVEC_ACTION = 12000;
let suivant = 1;

export default function ToastProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const minuteurs = useRef(new Map());

  const fermer = useCallback((id) => {
    setMessages((liste) => liste.filter((message) => message.id !== id));
    clearTimeout(minuteurs.current.get(id));
    minuteurs.current.delete(id);
  }, []);

  const afficher = useCallback((ton, texte, action) => {
    if (!texte) return;
    const id = suivant++;
    // Le même message affiché deux fois de suite ne s'empile pas.
    setMessages((liste) => [...liste.filter((message) => message.texte !== texte), { id, ton, texte, action }].slice(-4));
    if (ton === 'succes') {
      minuteurs.current.set(id, setTimeout(() => fermer(id), action ? DUREE_AVEC_ACTION : DUREE_SUCCES));
    }
  }, [fermer]);

  useEffect(() => {
    const actifs = minuteurs.current;
    return () => actifs.forEach((minuteur) => clearTimeout(minuteur));
  }, []);

  const api = useMemo(() => ({
    // action facultative : { libelle, onClick } — un bouton dans le message.
    succes: (texte, action) => afficher('succes', texte, action),
    erreur: (texte, action) => afficher('erreur', texte, action),
  }), [afficher]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="ui-toasts" aria-live="polite" aria-relevant="additions">
        {messages.map((message) => (
          <div key={message.id} className={`ui-toast is-${message.ton}`} role={message.ton === 'erreur' ? 'alert' : 'status'}>
            {message.ton === 'erreur'
              ? <AlertTriangle size={18} aria-hidden="true" />
              : <CheckCircle2 size={18} aria-hidden="true" />}
            <div className="ui-toast-corps">
              <p>{message.texte}</p>
              {message.action && (
                <button
                  type="button"
                  className="ui-toast-action"
                  onClick={() => { fermer(message.id); message.action.onClick(); }}
                >
                  {message.action.libelle}
                </button>
              )}
            </div>
            <button type="button" aria-label="Fermer le message" onClick={() => fermer(message.id)}>
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
