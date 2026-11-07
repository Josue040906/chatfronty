import { describe, expect, it } from 'vitest';
import {
  fillYearGaps,
  getHiringSummary,
  getRingArcPath,
} from './dashboard-insights';

describe('fillYearGaps', () => {
  it('adds the years without hiring between the first and last year', () => {
    expect(fillYearGaps([
      { year: '2006', value: 1 },
      { year: '2009', value: 2 },
    ])).toEqual([
      { year: '2006', value: 1 },
      { year: '2007', value: 0 },
      { year: '2008', value: 0 },
      { year: '2009', value: 2 },
    ]);
  });

  it('returns an empty list when there is no hiring date', () => {
    expect(fillYearGaps([])).toEqual([]);
  });
});

describe('getHiringSummary', () => {
  it('computes total, yearly average, peak and record years', () => {
    expect(getHiringSummary([
      { year: '2014', value: 3 },
      { year: '2015', value: 1 },
      { year: '2016', value: 3 },
      { year: '2017', value: 1 },
    ])).toEqual({
      total: 8,
      average: 2,
      peak: 3,
      peakYears: ['2014', '2016'],
    });
  });

  it('reports no record year when nobody was hired', () => {
    expect(getHiringSummary([{ year: '2020', value: 0 }]).peakYears)
      .toEqual([]);
    expect(getHiringSummary([]).total).toBe(0);
  });
});

describe('getRingArcPath', () => {
  it('draws a quarter turn starting at the top of the ring', () => {
    expect(getRingArcPath(0, 90, 100)).toBe('M 100 0 A 100 100 0 0 1 200 100');
  });

  it('flags arcs longer than half a turn', () => {
    expect(getRingArcPath(0, 270, 100)).toContain('A 100 100 0 1 1');
  });
});
