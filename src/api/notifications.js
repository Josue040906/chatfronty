import { apiDelete, apiGet, apiPatch } from './client';

export async function getNotifications(signal) {
  const response = await apiGet('/api/notifications?limite=50', { signal });

  if (
    !Array.isArray(response?.notifications) ||
    !Number.isInteger(response?.nonLues) ||
    response.nonLues < 0
  ) {
    throw new Error(
      'Le serveur a retourné des données de notification invalides.'
    );
  }

  return response;
}

export function markNotificationRead(notificationId) {
  return apiPatch(
    `/api/notifications/${encodeURIComponent(notificationId)}/lue`
  );
}

export function markAllNotificationsRead() {
  return apiPatch('/api/notifications/lues');
}

export function deleteNotification(notificationId) {
  return apiDelete(
    `/api/notifications/${encodeURIComponent(notificationId)}`
  );
}
