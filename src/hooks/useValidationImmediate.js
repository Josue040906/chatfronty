import { useCallback, useState } from 'react';

/**
 * Les erreurs d'un formulaire, montrées dès qu'on quitte un champ (puis mises
 * à jour à chaque frappe), et non plus seulement au moment d'enregistrer.
 *
 * regles : { champ: (valeurs) => message d'erreur ou '' }.
 * Renvoie :
 * - erreur(champ) : le message à afficher, seulement si le champ a été quitté ;
 * - quitter(champ) : à brancher sur onBlur ;
 * - verifier(champs) : marque ces champs comme vus et dit s'ils sont tous valides
 *   (avant de passer à l'étape suivante ou d'enregistrer) ;
 * - champProps(champ) : aria-invalid, aria-describedby et onBlur, prêts à étaler.
 */
export default function useValidationImmediate(valeurs, regles) {
  const [vus, setVus] = useState(() => new Set());

  const message = useCallback(
    (champ) => (regles[champ] ? regles[champ](valeurs) || '' : ''),
    [regles, valeurs]
  );

  const quitter = useCallback((champ) => {
    setVus((courant) => (courant.has(champ) ? courant : new Set(courant).add(champ)));
  }, []);

  const verifier = useCallback((champs = Object.keys(regles)) => {
    setVus((courant) => new Set([...courant, ...champs]));
    return champs.every((champ) => !message(champ));
  }, [message, regles]);

  const erreur = (champ) => (vus.has(champ) ? message(champ) : '');

  const champProps = (champ) => {
    const texte = erreur(champ);
    return {
      onBlur: () => quitter(champ),
      'aria-invalid': texte ? true : undefined,
      'aria-describedby': texte ? `${champ}-erreur` : undefined,
    };
  };

  return { erreur, quitter, verifier, champProps };
}
