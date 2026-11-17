// Une recherche approchée peut garder plusieurs candidats : l'API a déjà
// écarté ceux qui ne ressemblent pas assez. Mais face à une correspondance
// exacte (100 %), seuls les candidats qui lui ressemblent de près (85 % ou
// plus) restent affichés.
const EXACT_SCORE = 0.995;
const EXACT_MARGIN = 0.15;

const MAX_REASON = 160;

/**
 * Pourquoi l'API a retenu l'agent (champ « correspondance ») : les valeurs
 * des critères qui l'ont fait choisir, en clair, sur une ligne. Une valeur
 * que la fiche montre déjà (poste, service, type d'emploi) n'est pas répétée.
 */
function matchReason(agent, shown) {
  const match = agent?.correspondance;
  if (!match || typeof match !== 'object' || Array.isArray(match)) {
    return '';
  }
  const visibles = shown.map((part) => part.toLowerCase());
  const reason = Object.values(match)
    .filter((value) => ['string', 'number'].includes(typeof value) && String(value).trim())
    .filter((value) => {
      const texte = String(value).trim().toLowerCase();
      return !visibles.some((part) => texte.includes(part));
    })
    .join(' · ');
  return reason.length > MAX_REASON ? `${reason.slice(0, MAX_REASON - 1)}…` : reason;
}

function validScore(agent) {
  return Number.isFinite(agent?.score_correspondance)
    && agent.score_correspondance >= 0
    && agent.score_correspondance <= 1
    ? agent.score_correspondance
    : null;
}

/** Les agents qu'un autre outil que la recherche a examinés : par son agentId, ou le profil lu. */
function agentsExamines(toolResults) {
  return toolResults
    .filter((toolResult) => toolResult?.name !== 'search_agents')
    .map((toolResult) => (toolResult.name === 'get_agent_profile'
      ? toolResult.result?.id
      : Number(toolResult.arguments?.agentId)))
    .filter((id) => Number.isSafeInteger(id) && id > 0);
}

export function getNavigableAgents(toolResults) {
  if (!Array.isArray(toolResults)) {
    return [];
  }

  const agents = new Map();
  for (const toolResult of toolResults) {
    if (
      toolResult?.name !== 'search_agents'
      || !Array.isArray(toolResult.result?.agents)
    ) {
      continue;
    }

    for (const agent of toolResult.result.agents) {
      if (!Number.isSafeInteger(agent?.id) || agent.id < 1) {
        continue;
      }

      const name = [agent.prenom, agent.nom]
        .filter((part) => typeof part === 'string' && part.trim())
        .join(' ');
      if (!name) {
        continue;
      }

      const typeEmploi = typeof agent.type_emploi === 'string' ? agent.type_emploi : null;
      const meta = [agent.poste, agent.service]
        .filter((part) => typeof part === 'string' && part.trim());
      agents.set(agent.id, {
        id: String(agent.id),
        name,
        meta: meta.join(' · '),
        typeEmploi,
        reason: matchReason(agent, typeEmploi ? [...meta, typeEmploi] : meta),
        score: validScore(agent),
      });
    }
  }

  // Une recherche qui servait seulement à retrouver un agent (« le deuxième ») ne
  // réaffiche pas toute la liste : seuls les agents que la réponse examine restent.
  const examines = agentsExamines(toolResults).filter((id) => agents.has(id));
  if (examines.length > 0) {
    for (const id of [...agents.keys()]) {
      if (!examines.includes(id)) agents.delete(id);
    }
  }

  const scores = [...agents.values()].map(({ score }) => score).filter((score) => score !== null);
  const best = scores.length > 0 ? Math.max(...scores) : null;
  return [...agents.values()]
    .filter(({ score }) => best === null || best < EXACT_SCORE
      || score === null || score >= best - EXACT_MARGIN)
    .map(({ score, ...agent }) => ({
      ...agent,
      similarityPercent: score === null ? null : Math.round(score * 100),
    }));
}
