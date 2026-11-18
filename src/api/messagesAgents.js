import { apiGet, apiPost } from './client';

// Les e-mails aux agents : brouillons proposés (PROPOSE), envoyés, écartés ou en échec.
export async function getMessagesAgents({ statut, employeId, recentsMinutes } = {}) {
  const parametres = new URLSearchParams();
  if (statut) parametres.set('statut', statut);
  if (employeId) parametres.set('employeId', employeId);
  if (recentsMinutes) parametres.set('recentsMinutes', recentsMinutes);
  const suite = parametres.toString();
  const reponse = await apiGet(`/api/messages-agents${suite ? `?${suite}` : ''}`);
  return Array.isArray(reponse) ? reponse : reponse?.value || [];
}

export async function getModeEnvoi() {
  return apiGet('/api/messages-agents/mode');
}

/** Envoie le message tel que relu. */
export async function envoyerMessageAgent(id, { sujet, corps }) {
  return apiPost(`/api/messages-agents/${encodeURIComponent(id)}/envoyer`, { sujet, corps });
}

export async function ecarterMessageAgent(id) {
  return apiPost(`/api/messages-agents/${encodeURIComponent(id)}/ecarter`, {});
}
