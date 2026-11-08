// Un candidat bien plus loin que le meilleur score n'est pas montré : face à
// 100 %, une carte à 44 % n'aide pas à choisir. Des scores proches restent
// tous affichés, pour que l'utilisateur tranche.
const SCORE_MARGIN = 0.15;

function validScore(agent) {
  return Number.isFinite(agent?.score_correspondance)
    && agent.score_correspondance >= 0
    && agent.score_correspondance <= 1
    ? agent.score_correspondance
    : null;
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

      agents.set(agent.id, {
        id: String(agent.id),
        name,
        meta: [agent.poste, agent.service]
          .filter((part) => typeof part === 'string' && part.trim())
          .join(' · '),
        score: validScore(agent),
      });
    }
  }

  const scores = [...agents.values()].map(({ score }) => score).filter((score) => score !== null);
  const best = scores.length > 0 ? Math.max(...scores) : null;
  return [...agents.values()]
    .filter(({ score }) => score === null || score >= best - SCORE_MARGIN)
    .map(({ score, ...agent }) => ({
      ...agent,
      similarityPercent: score === null ? null : Math.round(score * 100),
    }));
}
