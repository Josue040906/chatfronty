import { apiGet } from './client';

/** Le plan de relève : départs, postes à risque, services touchés, sur « horizon » années. */
export async function getReleve(horizon = 2) {
  return apiGet(`/api/releve?horizon=${encodeURIComponent(horizon)}`);
}
