import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Un filtre de liste porté par l'adresse (par exemple /documents?statut=BROUILLON) :
 * la carte « À faire » et Bandy peuvent ainsi ouvrir une liste déjà filtrée.
 * Une valeur inconnue est ignorée ; revenir à emptyValue retire le paramètre.
 * allowedValues à null accepte toute valeur : c'est alors l'API qui la juge.
 */
export default function useUrlFilter(name, allowedValues, emptyValue) {
  const [params, setParams] = useSearchParams();
  const requested = params.get(name);
  const known = allowedValues === null ? Boolean(requested) : allowedValues.includes(requested);
  const value = known ? requested : emptyValue;

  const setValue = useCallback((next) => {
    setParams((current) => {
      const updated = new URLSearchParams(current);
      if (next === emptyValue) {
        updated.delete(name);
      } else {
        updated.set(name, next);
      }
      return updated;
    }, { replace: true });
  }, [emptyValue, name, setParams]);

  return [value, setValue];
}
