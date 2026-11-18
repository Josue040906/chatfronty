import { apiDelete, apiGet, apiPut } from './client';

/** Le plan de relève : départs, postes à risque, services touchés, sur « horizon » années. */
export async function getReleve(horizon = 2) {
  return apiGet(`/api/releve?horizon=${encodeURIComponent(horizon)}`);
}

/** Désigne le successeur pressenti d'un poste : { successeurId, statut, note }. */
export async function designerReleve(posteId, { successeurId, statut, note }) {
  return apiPut(`/api/releve/postes/${encodeURIComponent(posteId)}`, { successeurId, statut, note });
}

export async function retirerReleve(posteId) {
  return apiDelete(`/api/releve/postes/${encodeURIComponent(posteId)}`);
}
