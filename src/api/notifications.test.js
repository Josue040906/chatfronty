import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sessionStorage = new Map();

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: (key) => sessionStorage.get(key) ?? null,
  });
  sessionStorage.set(
    'user',
    JSON.stringify({ accessToken: 'test-session-token' })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('notifications API', () => {
  it('loads notifications and the unread count using the RH session', async () => {
    const response = { notifications: [], nonLues: 2 };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(response));
    vi.stubGlobal('fetch', fetchMock);
    const { getNotifications } = await import('./notifications');

    await expect(getNotifications()).resolves.toEqual(response);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications?limite=50'),
      expect.objectContaining({
        headers: {
          Authorization: expect.stringMatching(/^Bearer /),
        },
      })
    );
  });

  it('marks all notifications as read through the RH API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 204 })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { markAllNotificationsRead } = await import('./notifications');

    await expect(markAllNotificationsRead()).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/lues'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('deletes only the selected notification through the RH API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 204 })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { deleteNotification } = await import('./notifications');

    await expect(deleteNotification(42)).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/42'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('surfaces server failures instead of reporting a successful read', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse({ message: 'Refusé' }, 403)
    ));
    const { markAllNotificationsRead } = await import('./notifications');

    await expect(markAllNotificationsRead()).rejects.toMatchObject({
      message: 'Refusé',
      status: 403,
    });
  });
});
