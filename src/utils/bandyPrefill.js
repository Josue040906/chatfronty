// Préremplissage d'un formulaire par une tâche préparée de Bandy.
// Bandy n'enregistre rien : il transmet les champs qu'il propose, l'interface
// les signale (surlignés en vert) et l'utilisateur valide lui-même.

export const PREFILL_STATE_KEY = 'bandyPrefill';

/** État de navigation qui porte les champs proposés vers le formulaire. */
export function prefillNavigationState(fields) {
  return { [PREFILL_STATE_KEY]: { fields } };
}

/** Champs proposés lus dans l'état de navigation, ou null. */
export function readPrefill(locationState) {
  const fields = locationState?.[PREFILL_STATE_KEY]?.fields;
  return fields && typeof fields === 'object' && !Array.isArray(fields) ? fields : null;
}

/**
 * Applique les champs proposés à un formulaire. Seuls les champs que le
 * formulaire connaît et dont la valeur est simple sont pris ; `changed` liste
 * ceux dont la valeur diffère de la valeur actuelle (ceux à surligner).
 */
export function applyPrefill(form, fields) {
  const next = { ...form };
  const changed = [];
  if (!fields) {
    return { form: next, changed };
  }
  for (const [name, value] of Object.entries(fields)) {
    if (!Object.hasOwn(form, name) || !['string', 'number', 'boolean'].includes(typeof value)) {
      continue;
    }
    const proposed = String(value);
    if (String(form[name] ?? '') !== proposed) {
      next[name] = proposed;
      changed.push(name);
    }
  }
  return { form: next, changed };
}

/** Classe d'un bloc de champ, avec le surlignage s'il a été prérempli. */
export function prefillClass(baseClass, name, prefilled) {
  return prefilled.includes(name) ? `${baseClass} bandy-prefilled` : baseClass;
}
