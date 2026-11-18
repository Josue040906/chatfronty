import { useCallback, useMemo, useState } from 'react';
import { getMessagesAgents } from '../../api/messagesAgents';
import { useToast } from '../ui/toastContext';
import { MessageAgentContext } from './messageAgentContext';
import MessageAgentDialog from './MessageAgentDialog';

/**
 * La fenêtre d'envoi d'un e-mail à un agent, ouvrable de partout : après une
 * action (« Prévenir Hery par e-mail »), depuis la cloche ou la page Messages.
 * Après envoi ou écart, l'événement « messages-agents:change » prévient les
 * listes ouvertes.
 */
export default function MessageAgentProvider({ children }) {
  const toast = useToast();
  const [ouvert, setOuvert] = useState(null);

  const ouvrir = useCallback(async (messageOuId) => {
    if (messageOuId && typeof messageOuId === 'object') {
      setOuvert(messageOuId);
      return;
    }
    try {
      const enAttente = await getMessagesAgents({ statut: 'PROPOSE' });
      const message = enAttente.find((item) => String(item.id) === String(messageOuId));
      if (message) setOuvert(message);
      else toast.erreur('Ce message a déjà été traité.');
    } catch (err) {
      toast.erreur(err?.message || 'Le message n’a pas pu être ouvert.');
    }
  }, [toast]);

  /** Le succès d'une action, avec « Prévenir … par e-mail » si un brouillon vient d'être préparé. */
  const proposerApres = useCallback(async (employeId, texteSucces) => {
    let brouillon = null;
    try {
      // Seulement le brouillon que l'action vient de préparer, pas un plus ancien.
      [brouillon] = await getMessagesAgents({ statut: 'PROPOSE', employeId, recentsMinutes: 5 });
    } catch {
      brouillon = null;
    }
    toast.succes(texteSucces, brouillon
      ? { libelle: `Prévenir ${brouillon.prenom || 'l’agent'} par e-mail`, onClick: () => setOuvert(brouillon) }
      : undefined);
  }, [toast]);

  const valeur = useMemo(() => ({ ouvrir, proposerApres }), [ouvrir, proposerApres]);

  return (
    <MessageAgentContext.Provider value={valeur}>
      {children}
      {ouvert && (
        <MessageAgentDialog
          key={ouvert.id}
          message={ouvert}
          onClose={() => setOuvert(null)}
          onDone={(_, texte) => {
            setOuvert(null);
            toast.succes(texte);
            window.dispatchEvent(new CustomEvent('messages-agents:change'));
          }}
        />
      )}
    </MessageAgentContext.Provider>
  );
}
