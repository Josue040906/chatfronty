import { describe, expect, it } from 'vitest';
import {
  getEmployeeDistribution,
  getEmployeesByHiringYear,
  getPieSlices,
  getPieSlicePath,
} from './dashboard-metrics';

describe('dashboard chart metrics', () => {
  it('groups employee counts by service and includes missing assignments', () => {
    const employees = [
      { service: 'Budget' },
      { service: 'Budget' },
      { code_service: 'RH' },
      {},
    ];

    expect(getEmployeeDistribution(employees, 'service')).toEqual([
      { label: 'Budget', value: 2 },
      { label: 'Non renseigné', value: 1 },
      { label: 'RH', value: 1 },
    ]);
  });

  it('groups employee counts by direction', () => {
    expect(getEmployeeDistribution([
      { direction: 'Finances' },
      { direction: 'Finances' },
      { direction: 'Budget' },
    ], 'direction')).toEqual([
      { label: 'Finances', value: 2 },
      { label: 'Budget', value: 1 },
    ]);
  });

  it('counts valid hiring years and ignores empty or invalid dates', () => {
    expect(getEmployeesByHiringYear([
      { date_embauche: '2021-06-15' },
      { date_embauche: '2020-01-01' },
      { date_embauche: '2021-12-02' },
      { date_embauche: null },
      { date_embauche: 'date inconnue' },
    ])).toEqual([
      { year: '2020', value: 1 },
      { year: '2021', value: 2 },
    ]);
  });

  it('builds a valid pie-slice path for the full circle', () => {
    expect(getPieSlicePath(0, 360, 100)).toContain('A 100 100 0 1 1');
  });

  it('computes contiguous pie slice angles that cover the full circle', () => {
    expect(getPieSlices([
      { label: 'Services', value: 1 },
      { label: 'Directions', value: 3 },
    ], 4)).toEqual([
      { label: 'Services', value: 1, startAngle: 0, endAngle: 90 },
      { label: 'Directions', value: 3, startAngle: 90, endAngle: 360 },
    ]);
  });
});
