const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function getEmployeePhotoUrl(photo) {
  if (!photo) {
    return '';
  }

  if (
    photo.startsWith('http://') ||
    photo.startsWith('https://')
  ) {
    return photo;
  }

  return `${API_URL}${photo}`;
}

export function getEmployeeInitials(agent) {
  const first = agent?.prenom?.charAt(0) || '';
  const last = agent?.nom?.charAt(0) || '';

  return `${first}${last}`.toUpperCase();
}