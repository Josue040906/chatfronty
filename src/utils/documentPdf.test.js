import { describe, expect, it } from 'vitest';
import { canOpenPdf } from './documentPdf';

describe('canOpenPdf', () => {
  it('knows which request types the server can render as PDF', () => {
    expect(canOpenPdf({ code: 'CONGE' })).toBe(true);
    expect(canOpenPdf({ code: 'MUTATION' })).toBe(true);
    expect(canOpenPdf({ code: 'ATTESTATION' })).toBe(false);
    expect(canOpenPdf(undefined)).toBe(false);
  });
});
