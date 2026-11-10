import { describe, expect, it } from 'vitest';
import { gradeLabel, grilleDuParcours, groupParcours, indiceLabel } from './parcours';

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

describe('grilleDuParcours', () => {
  it('keeps only the asked path, categories in order, and leaves missing cells empty', () => {
    const grille = grilleDuParcours([
      { parcours_code: 'F', categorie: 'I', grade_code: '3C1E', indice: 350 },
      { parcours_code: 'F', categorie: 'II', grade_code: '3C1E', indice: 400 },
      { parcours_code: 'S', categorie: 'I', grade_code: 'ST01E', indice: 150 },
    ], 'F');
    expect(grille.categories).toEqual(['I', 'II']);
    expect(grille.indice('II', '3C1E')).toBe(400);
    expect(grille.indice('I', 'ST01E')).toBeNull();
  });
});

describe('indiceLabel', () => {
  it('says plainly when the grid has no value', () => {
    expect(indiceLabel(470)).toBe('Indice 470');
    expect(indiceLabel(null)).toBe('Indice non renseigné');
  });
});
