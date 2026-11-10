import {
  apiGet,
  apiPost,
  apiPostFormData,
  apiPut,
} from './client';

export async function getAgents() {
  const response = await apiGet('/api/employes');

  return Array.isArray(response)
    ? response
    : response.value || [];
}

const SELECTION_PAGE = 50;

/**
 * Identifiants des agents qui répondent aux critères d'une recherche de
 * Bandy, relancée telle quelle auprès de l'API, page après page.
 */
export async function searchAgentIds(criteriaJson) {
  const criteria = JSON.parse(criteriaJson);
  const ids = [];
  for (let offset = 0; ; offset += SELECTION_PAGE) {
    const page = await apiPost('/api/recherche/agents/avancee', {
      criteriaJson: JSON.stringify({ ...criteria, limit: SELECTION_PAGE, offset }),
    });
    const agents = Array.isArray(page?.agents) ? page.agents : [];
    ids.push(...agents.map((agent) => String(agent.id)));
    if (!page?.hasMore || agents.length === 0) {
      return ids;
    }
  }
}

export async function getAgentById(id) {
  return apiGet(`/api/employes/${id}`);
}

export async function getAgentReferenceData() {
  const response = await apiGet('/api/employes/referentiels');

  if (
    !Array.isArray(response?.typesEmploi) ||
    !Array.isArray(response?.categories)
  ) {
    throw new Error(
      'Les référentiels nécessaires au formulaire sont indisponibles.'
    );
  }

  return response;
}

export async function createAgent(data) {
  return apiPost('/api/employes', {
    matricule: data.matricule,
    nom: data.nom,
    prenom: data.prenom,
    sexe: data.sexe || null,
    adresse: data.adresse || null,
    localiteResidenceId: data.localiteResidenceId || null,
    cin: data.cin || null,
    telephone: data.telephone || null,
    dateNaissance: data.dateNaissance || null,
    lieuNaissance: data.lieuNaissance || null,
    dateEmbauche: data.dateEmbauche,
    posteId: Number(data.posteId),
    serviceId: Number(data.serviceId),
    typeEmploiId: data.typeEmploiId
      ? Number(data.typeEmploiId)
      : null,
    categorieId: data.categorieId
      ? Number(data.categorieId)
      : null,
    lieuTravail: data.lieuTravail || null,
    photo: '',
  });
}

export async function updateAgent(id, data) {
  if (!data?.acteurId) {
    throw new Error(
      "L'identifiant de l'acteur connecté est obligatoire."
    );
  }

  return apiPut(
    `/api/employes/${encodeURIComponent(id)}`,
    {
      acteurId: data.acteurId,
      nom: data.nom,
      prenom: data.prenom,
      sexe: data.sexe,
      adresse: data.adresse,
      localiteResidenceId: data.localiteResidenceId || null,
      effacerLocaliteResidence: Boolean(data.effacerLocaliteResidence),
      cin: data.cin,
      telephone: data.telephone,
      dateNaissance: data.dateNaissance || null,
      lieuNaissance: data.lieuNaissance,
    }
  );
}

export async function updateAgentAssignment(id, data) {
  return apiPut(
    `/api/employes/${encodeURIComponent(id)}/affectation`,
    {
      acteurId: data.acteurId ? Number(data.acteurId) : null,
      posteId: Number(data.posteId),
      serviceId: Number(data.serviceId),
      lieuTravail: data.lieuTravail?.trim() || null,
      dateEffet: data.dateEffet,
      referenceActe: data.referenceActe?.trim() || null,
      observation: data.observation?.trim() || null,
    }
  );
}

export async function uploadAgentPhoto(id, file, acteurId) {
  if (!acteurId) {
    throw new Error(
      "L'identifiant de l'acteur connecté est obligatoire."
    );
  }

  const formData = new FormData();

  formData.append('file', file);

  return apiPostFormData(
    `/api/employes/${encodeURIComponent(id)}/photo?acteurId=${encodeURIComponent(acteurId)}`,
    formData
  );
}

export async function searchAgents(query) {
  const value = query?.trim();

  if (!value) {
    return getAgents();
  }

  const response = await apiGet(
    `/api/employes/recherche?query=${encodeURIComponent(value)}`
  );

  return Array.isArray(response)
    ? response
    : response.value || [];
}
