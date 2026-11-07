// Actions proposées par Bandy (champ `actions` de sa réponse). Bandy ne fait
// que proposer : l'utilisateur clique, et le garde de routes du front comme
// l'API restent juges des droits.

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

function routeLabel(route) {
  const path = route.split('?')[0];
  return ROUTE_LABELS.find(({ pattern }) => pattern.test(path))?.label || 'Ouvrir la page';
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
 * Actions de navigation affichables, sans doublon avec les cartes d'agents
 * déjà présentes (agentIds) : une même fiche n'a qu'un seul bouton.
 */
export function getNavigationActions(actions, agentIds = []) {
  if (!Array.isArray(actions)) {
    return [];
  }
  const agentRoutes = new Set(agentIds.map((id) => `/agents/${id}`));
  const routes = new Map();
  for (const action of actions) {
    if (action?.type !== 'NAVIGATE' || !isInternalRoute(action.route)) {
      continue;
    }
    if (agentRoutes.has(action.route) || routes.has(action.route)) {
      continue;
    }
    routes.set(action.route, { route: action.route, label: routeLabel(action.route) });
  }
  return [...routes.values()];
}
