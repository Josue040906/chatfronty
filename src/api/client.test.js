import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from './client';

const storedValues = new Map();

beforeEach(() => {
  storedValues.set(
    'user',
    JSON.stringify({ accessToken: 'expired-session-token' })
  );
  vi.stubGlobal('localStorage', {
    getItem: (key) => storedValues.get(key) ?? null,
  });
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
});

afterEach(() => {
  vi.unstubAllGlobals();
  storedValues.clear();
});

describe('authenticated API client', () => {
  it('signals the auth provider when the RH API rejects an expired session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Jeton expiré.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    ));

    await expect(apiGet('/api/profil')).rejects.toMatchObject({
      status: 401,
      message: 'Jeton expiré.',
    });
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth:session-expired' })
    );
  });

  it('does not expire the session for authorization denials', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Accès refusé.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    ));

    await expect(apiGet('/api/profil')).rejects.toMatchObject({
      status: 403,
    });
    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });
});
