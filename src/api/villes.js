import { apiGet } from './client';

export async function getVilles() {
  const response = await apiGet('/api/villes');

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  throw new Error('La liste des villes reçue du serveur est invalide.');
}
