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
