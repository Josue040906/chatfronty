// Actions proposées par Bandy (champ `actions` de sa réponse). Bandy ne fait
// que proposer : l'utilisateur clique, et le garde de routes du front comme
// l'API restent juges des droits.

import { getNavigableAgents } from './assistant-agents';

// Une route interne de l'application : un seul « / » initial, sans schéma,
// sans espace ni barre oblique inverse. Rien d'autre n'est jamais suivi.
const INTERNAL_ROUTE = /^\/(?!\/)[^\s\\]*$/;

const ROUTE_LABELS = [
  { pattern: /^\/agents\/\d+$/, label: 'Ouvrir la fiche de l’agent' },
  { pattern: /^\/agents$/, label: 'Ouvrir la liste des agents' },
  { pattern: /^\/documents$/, label: 'Ouvrir les documents' },
  { pattern: /^\/activites$/, label: 'Ouvrir mes activités' },
];

export function isInternalRoute(route) {
  return typeof route === 'string' && INTERNAL_ROUTE.test(route) && !route.includes('://');
}

const AGENT_RECORD = /^\/agents\/\d+$/;

/**
 * Le paramètre « nom » d'une navigation sert seulement au libellé du bouton
 * (« Ouvrir la fiche de Hery Randria ») : il est retiré de l'adresse ouverte.
 */
function navigationTarget(route, knownNames = new Map()) {
  const [path, query = ''] = route.split('?');
  const params = new URLSearchParams(query);
  // Sans « nom », le nom de l'agent trouvé par la recherche du même tour.
  const name = ((params.get('nom') || '').trim() || knownNames.get(path) || '').slice(0, 80);
  params.delete('nom');
  const rest = params.toString();
  const label = name && AGENT_RECORD.test(path)
    ? `Ouvrir la fiche de ${name}`
    : path === '/agents' && params.has('recherche')
      ? 'Voir ces agents dans la page Agents'
      : ROUTE_LABELS.find(({ pattern }) => pattern.test(path))?.label || 'Ouvrir la page';
  return { route: rest ? `${path}?${rest}` : path, label };
}

/**
 * Éléments « À faire » affichables : un libellé, un nombre positif et une
 * route interne. L'API décide de ce qui est listé ; le front ne fait que
 * l'afficher, sans rien suivre d'autre qu'une route de l'application.
 */
export function getTodoItems(elements) {
  if (!Array.isArray(elements)) {
    return [];
  }
  return elements
    .filter((element) => typeof element?.libelle === 'string' && element.libelle.trim()
      && Number.isSafeInteger(element.nombre) && element.nombre > 0
      && isInternalRoute(element.route))
    .map(({ libelle, nombre, route }) => ({ label: libelle.trim(), count: nombre, route }));
}

const UUID = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** « dateEffetSouhaitee » → « Date effet souhaitee » : libellé lisible d'un champ. */
function fieldLabel(name) {
  const words = name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Tâches confirmées : rien n'est exécuté tant que l'utilisateur n'a pas
 * cliqué « Confirmer ». La carte récapitule ce qui sera envoyé.
 */
export function getConfirmationActions(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }
  return actions
    .filter((action) => action?.type === 'CONFIRM' && UUID.test(action.confirmationId || ''))
    .map((action) => {
      // Le résumé vérifié par l'API (aperçu) dit en clair ce qui sera créé ;
      // sans lui, la carte montre les champs envoyés.
      const verified = isPlainObject(action.summary) && Object.keys(action.summary).length > 0;
      return {
        confirmationId: action.confirmationId,
        status: 'pending',
        outcome: '',
        verified,
        details: Object.entries(verified ? action.summary : (isPlainObject(action.fields) ? action.fields : {}))
          .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
          .map(([name, value]) => ({ label: verified ? name : fieldLabel(name), value: String(value) })),
      };
    });
}

/** Message affiché après le clic « Confirmer », d'après la réponse de Bandy. */
export function confirmationOutcomeMessage(outcome) {
  if (outcome?.status === 'CONFIRMED') {
    return 'Action confirmée et exécutée.';
  }
  const refusal = outcome?.result?.message;
  const detail = typeof refusal === 'string'
    ? refusal
    : typeof refusal?.message === 'string' ? refusal.message : '';
  return detail ? `Action refusée : ${detail}` : 'Action refusée par le service RH.';
}

const PREPARED_LABELS = [
  { pattern: /^\/agents\/\d+$/, label: 'Ouvrir la modification préremplie' },
  { pattern: /^\/documents\/nouveau$/, label: 'Ouvrir le nouveau document prérempli' },
];

/**
 * Tâches préparées : un formulaire à ouvrir, prérempli avec les seuls champs
 * proposés. Rien n'est enregistré avant la validation de l'utilisateur.
 */
export function getPreparedActions(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }
  return actions
    .filter((action) => action?.type === 'PREPARE'
      && isInternalRoute(action.route)
      && action.fields
      && typeof action.fields === 'object'
      && !Array.isArray(action.fields)
      && Object.keys(action.fields).length > 0)
    .map((action) => ({
      route: action.route,
      fields: action.fields,
      label: PREPARED_LABELS.find(({ pattern }) => pattern.test(action.route.split('?')[0]))
        ?.label || 'Ouvrir le formulaire prérempli',
    }));
}

/**
 * Actions de navigation affichables, une seule par page. knownAgents (les
 * agents de la recherche du même tour) donne le nom d'un agent dont Bandy
 * n'a pas transmis le nom.
 */
export function getNavigationActions(actions, knownAgents = []) {
  if (!Array.isArray(actions)) {
    return [];
  }
  const knownNames = new Map(knownAgents.map((agent) => [`/agents/${agent.id}`, agent.name]));
  const routes = new Map();
  for (const action of actions) {
    if (action?.type !== 'NAVIGATE' || !isInternalRoute(action.route)) {
      continue;
    }
    const target = navigationTarget(action.route, knownNames);
    if (!routes.has(target.route)) {
      routes.set(target.route, target);
    }
  }
  return [...routes.values()];
}

// Au-delà de ce nombre d'agents trouvés par un filtrage, la bulle ne montre
// plus de cartes : elle propose la liste complète sur la page Agents.
export const MAX_AGENT_CARDS = 4;
// Ce qui ne filtre pas : pagination, tri et répartition (statistiques).
const NON_FILTER_KEYS = ['limit', 'offset', 'sortBy', 'sortDirection', 'groupBy', 'measures'];

/**
 * Lien vers la page Agents restreinte au résultat du dernier filtrage
 * (critères sans similarité de nom), quand il dépasse MAX_AGENT_CARDS.
 * La page relance elle-même les mêmes critères auprès de l'API : la liste
 * affichée est toujours celle que l'API calcule, jamais une copie.
 */
export function getFilteredListAction(toolResults) {
  const search = Array.isArray(toolResults)
    ? toolResults.filter((toolResult) => toolResult?.name === 'search_agents').at(-1)
    : null;
  const total = search?.result?.total;
  const agents = Array.isArray(search?.result?.agents) ? search.result.agents : [];
  const isFilter = agents.every((agent) => !Number.isFinite(agent?.score_correspondance));
  if (!Number.isSafeInteger(total) || total <= MAX_AGENT_CARDS || !isFilter) {
    return null;
  }
  let criteria;
  try {
    criteria = JSON.parse(search.arguments?.criteriaJson);
  } catch {
    return null;
  }
  // Sans critère positif (une statistique sur tous les agents), la liste
  // complète est déjà la page Agents : aucun lien restreint à proposer.
  const hasCriterion = ['must', 'should']
    .some((key) => Array.isArray(criteria?.[key]) && criteria[key].length > 0);
  if (!hasCriterion || Array.isArray(criteria)) {
    return null;
  }
  NON_FILTER_KEYS.forEach((key) => delete criteria[key]);
  return {
    route: `/agents?recherche=${encodeURIComponent(JSON.stringify(criteria))}`,
    label: `Voir les ${total} agents dans la liste`,
  };
}

const MAX_STATISTIC_ROWS = 20;
const COLUMN_PREFIXES = { moyenne: 'Moyenne', minimum: 'Minimum', maximum: 'Maximum', somme: 'Somme' };

/** « diplomes.niveau » → « Niveau (diplomes) », « moyenne_age » → « Moyenne age », « nombre » → « Agents ». */
function columnLabel(key) {
  if (key === 'nombre') {
    return 'Agents';
  }
  const [list, field] = key.includes('.') ? key.split('.') : [null, key];
  const [first, ...rest] = field.split('_');
  const words = [COLUMN_PREFIXES[first] || first, ...rest].join(' ');
  const label = words.charAt(0).toUpperCase() + words.slice(1);
  return list ? `${label} (${list})` : label;
}

/**
 * Tableau d'une répartition (search_agents en mode GROUP) : les chiffres
 * viennent tels quels de l'API ; un groupe sans valeur est « Non renseigné ».
 */
export function getStatistics(toolResults) {
  const grouped = Array.isArray(toolResults)
    ? toolResults.filter((toolResult) => toolResult?.name === 'search_agents'
      && Array.isArray(toolResult.result?.groupes) && toolResult.result.groupes.length > 0).at(-1)
    : null;
  if (!grouped) {
    return null;
  }
  const groups = grouped.result.groupes.filter((group) => group && typeof group === 'object');
  const keys = Object.keys(groups[0] || {});
  if (keys.length === 0) {
    return null;
  }
  const cell = (value) => (value === null || value === undefined || value === ''
    ? 'Non renseigné'
    : String(value));
  return {
    columns: keys.map(columnLabel),
    rows: groups.slice(0, MAX_STATISTIC_ROWS).map((group) => keys.map((key) => cell(group[key]))),
    hiddenRows: Math.max(0, groups.length - MAX_STATISTIC_ROWS),
    total: Number.isSafeInteger(grouped.result.total) ? grouped.result.total : null,
  };
}

/**
 * Ce que la bulle de Bandy affiche sous son texte. Quand Bandy propose une
 * action (ouvrir une page, une tâche préparée ou à confirmer), la recherche
 * qui a servi à trouver les agents n'est qu'une étape intermédiaire : ses
 * cartes ne sont pas montrées, pour que les boutons proposés soient les seuls
 * à suivre. De même quand un filtrage trouve trop d'agents pour des cartes :
 * le bouton de la liste complète les remplace.
 */
export function buildBandyReply(response) {
  const prepared = getPreparedActions(response?.actions);
  const confirmations = getConfirmationActions(response?.actions);
  const found = getNavigableAgents(response?.toolResults);
  const proposed = getNavigationActions(response?.actions, found);
  // Bandy a déjà proposé la page Agents restreinte à une recherche : pas de second bouton.
  const listProposed = proposed.some(({ route }) => /^\/agents\?(.*&)?recherche=/.test(route));
  const filteredList = listProposed ? null : getFilteredListAction(response?.toolResults);
  const navigation = [...(filteredList ? [filteredList] : []), ...proposed];
  const proposesAction = navigation.length > 0 || prepared.length > 0 || confirmations.length > 0;
  return {
    statistics: getStatistics(response?.toolResults),
    agents: proposesAction ? [] : found,
    navigation,
    prepared,
    confirmations,
  };
}
