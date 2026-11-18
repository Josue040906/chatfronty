import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

/** { succes(texte), erreur(texte) } ; sans fournisseur (tests), les messages sont ignorés. */
export function useToast() {
  return useContext(ToastContext) || { succes: () => {}, erreur: () => {} };
}
