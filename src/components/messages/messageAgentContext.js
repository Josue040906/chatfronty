import { createContext, useContext } from 'react';

export const MessageAgentContext = createContext(null);

/**
 * { ouvrir(message ou id), proposerApres(employeId, texteSucces) } ; sans
 * fournisseur (tests), ouvrir ne fait rien et proposerApres affiche le succès seul.
 */
export function useMessageAgent() {
  return useContext(MessageAgentContext) || { ouvrir: () => {}, proposerApres: () => {} };
}
