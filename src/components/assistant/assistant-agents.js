export function getNavigableAgents(toolResults) {
  if (!Array.isArray(toolResults)) {
    return [];
  }

  const agents = new Map();
  for (const toolResult of toolResults) {
    if (
      toolResult?.name !== 'searchEmployeesApproximately'
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
        similarityPercent: Number.isFinite(agent.score_correspondance)
          && agent.score_correspondance >= 0
          && agent.score_correspondance <= 1
          ? Math.round(agent.score_correspondance * 100)
          : null,
      });
    }
  }

  return [...agents.values()];
}
