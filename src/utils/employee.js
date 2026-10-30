import { API_BASE_URL } from '../api/client';

export function getEmployeePhotoUrl(photo) {
  if (typeof photo !== 'string' || !photo.trim()) {
    return '';
  }

  const photoUrl = photo.trim();

  if (
    photoUrl.startsWith('http://') ||
    photoUrl.startsWith('https://') ||
    photoUrl.startsWith('data:')
  ) {
    return photoUrl;
  }

  return `${API_BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
}

export function getEmployeeInitials(agent) {
  const first = agent?.nom?.charAt(0) || '';
  const last = agent?.prenom?.charAt(0) || '';
  

  return `${first}${last}`.toUpperCase();
}