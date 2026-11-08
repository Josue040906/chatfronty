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
    .map((action) => ({
      confirmationId: action.confirmationId,
      status: 'pending',
      outcome: '',
      details: Object.entries(
        action.fields && typeof action.fields === 'object' && !Array.isArray(action.fields)
          ? action.fields
          : {}
      )
        .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
        .map(([name, value]) => ({ label: fieldLabel(name), value: String(value) })),
    }));
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

/**
 * Ce que la bulle de Bandy affiche sous son texte. Quand Bandy propose une
 * action (ouvrir une page, une tâche préparée ou à confirmer), la recherche
 * qui a servi à trouver les agents n'est qu'une étape intermédiaire : ses
 * cartes ne sont pas montrées, pour que les boutons proposés soient les seuls
 * à suivre.
 */
export function buildBandyReply(response) {
  const prepared = getPreparedActions(response?.actions);
  const confirmations = getConfirmationActions(response?.actions);
  const found = getNavigableAgents(response?.toolResults);
  const navigation = getNavigationActions(response?.actions, found);
  const proposesAction = navigation.length > 0 || prepared.length > 0 || confirmations.length > 0;
  return {
    agents: proposesAction ? [] : found,
    navigation,
    prepared,
    confirmations,
  };
}
