import { describe, expect, it } from 'vitest';
import { canManageReferentiels } from './roles';

describe('canManageReferentiels', () => {
  it('lets only the SPERS chief manage organisation referentiels, like the API', () => {
    expect(canManageReferentiels({ role: 'SPERS_CHEF' })).toBe(true);
    expect(canManageReferentiels({ role: 'SPERS_AGENT' })).toBe(false);
    expect(canManageReferentiels(null)).toBe(false);
    expect(canManageReferentiels({})).toBe(false);
  });
});
