import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from './client';

function normalizeResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response?.value && Array.isArray(response.value)) {
    return response.value;
  }

  return [];
}

/**
 * Récupère toutes les règles RH.
 * Utilisé par l'administration.
 */
export async function getReglesRh() {
  const response = await apiGet('/api/regles-rh');
  return normalizeResponse(response);
}

/**
 * Récupère uniquement les règles RH actives.
 * Utilisé par les fonctionnalités métier.
 */
export async function getReglesRhActives() {
  const response = await apiGet('/api/regles-rh/actives');
  return normalizeResponse(response);
}

/**
 * Recherche des règles RH.
 */
export async function searchReglesRh(query) {
  const response = await apiGet(
    `/api/regles-rh/recherche?query=${encodeURIComponent(query || '')}`
  );

  return normalizeResponse(response);
}

/**
 * Récupère une règle RH par son ID.
 */
export async function getRegleRhById(id) {
  return apiGet(`/api/regles-rh/${id}`);
}

/**
 * Récupère une règle RH complète par son code métier.
 */
export async function getRegleRhByCode(code) {
  return apiGet(
    `/api/regles-rh/code/${encodeURIComponent(code)}`
  );
}

/**
 * Récupère les types de règles RH.
 */
export async function getTypesReglesRh() {
  const response = await apiGet('/api/regles-rh/types');
  return normalizeResponse(response);
}

/**
 * Crée une règle RH.
 */
export async function createRegleRh(data) {
  return apiPost('/api/regles-rh', data);
}

/**
 * Modifie une règle RH.
 */
export async function updateRegleRh(id, data) {
  return apiPut(`/api/regles-rh/${id}`, data);
}

/**
 * Supprime une règle RH.
 */
export async function deleteRegleRh(id) {
  return apiDelete(`/api/regles-rh/${id}`);
}