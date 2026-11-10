import { describe, expect, it } from 'vitest';
import { gradeLabel, groupParcours } from './parcours';

describe('groupParcours', () => {
  it('groups grades by employment type then career path, keeping the order', () => {
    const types = groupParcours([
      { type_emploi: 'Fonctionnaire', parcours_code: 'F', parcours: 'Classes et échelons', code: '3C1E' },
      { type_emploi: 'Fonctionnaire', parcours_code: 'F', parcours: 'Classes et échelons', code: '3C2E' },
      { type_emploi: 'Stagiaire', parcours_code: 'S', parcours: 'Stage', code: 'ST01E' },
    ]);
    expect(types.map((type) => type.nom)).toEqual(['Fonctionnaire', 'Stagiaire']);
    expect(types[0].parcours[0].grades.map((grade) => grade.code)).toEqual(['3C1E', '3C2E']);
  });
});

describe('gradeLabel', () => {
  it('shows the readable label first and the code as a hint', () => {
    expect(gradeLabel('2e classe, 2e échelon', '2C2E')).toBe('2e classe, 2e échelon (2C2E)');
    expect(gradeLabel(null, 'A11E')).toBe('A11E');
    expect(gradeLabel(null, null)).toBe('—');
  });
});
