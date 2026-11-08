import { describe, expect, it } from 'vitest';
import {
  applyPrefill,
  prefillClass,
  prefillNavigationState,
  readPrefill,
} from './bandyPrefill';

describe('bandyPrefill', () => {
  const agentForm = { nom: 'RAKOTO', prenom: 'Jean', telephone: '0331111111', sexe: 'M' };

  it('applies only the proposed fields and reports those that really change', () => {
    const { form, changed } = applyPrefill(agentForm, {
      telephone: '034 12 345 67',
      sexe: 'M',
    });

    expect(form).toEqual({ ...agentForm, telephone: '034 12 345 67' });
    // Le sexe proposé est déjà la valeur actuelle : rien à surligner.
    expect(changed).toEqual(['telephone']);
  });

  it('ignores unknown fields and non-scalar values', () => {
    const { form, changed } = applyPrefill(agentForm, {
      salaire: '999',
      nom: { injecte: true },
      prenom: ['x'],
    });

    expect(form).toEqual(agentForm);
    expect(changed).toEqual([]);
  });

  it('converts numbers to the string values used by inputs and selects', () => {
    const { form, changed } = applyPrefill(
      { typeDocumentId: '', employeId: '' },
      { typeDocumentId: 1, employeId: 101 }
    );

    expect(form).toEqual({ typeDocumentId: '1', employeId: '101' });
    expect(changed).toEqual(['typeDocumentId', 'employeId']);
  });

  it('carries the fields through the navigation state', () => {
    const state = prefillNavigationState({ motif: 'Congé annuel' });

    expect(readPrefill(state)).toEqual({ motif: 'Congé annuel' });
    expect(readPrefill(null)).toBeNull();
    expect(readPrefill({ bandyPrefill: { fields: ['x'] } })).toBeNull();
  });

  it('marks only prefilled field blocks', () => {
    expect(prefillClass('agent-form-field', 'telephone', ['telephone']))
      .toBe('agent-form-field bandy-prefilled');
    expect(prefillClass('agent-form-field', 'nom', ['telephone']))
      .toBe('agent-form-field');
  });
});
