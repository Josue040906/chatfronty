const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(
      `Erreur API ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}