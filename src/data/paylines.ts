import type { Payline } from '@/types';

/**
 * 20 fixed demo lines, evaluated left to right from reel 1.
 * Row indices: 0 = top, 1 = middle, 2 = bottom.
 */
export const PAYLINES: Payline[] = [
  { id: 1, name: 'Middle Path', rows: [1, 1, 1, 1, 1] },
  { id: 2, name: 'Upper Terrace', rows: [0, 0, 0, 0, 0] },
  { id: 3, name: 'Lower Terrace', rows: [2, 2, 2, 2, 2] },
  { id: 4, name: 'Descending Stair', rows: [0, 1, 2, 1, 0] },
  { id: 5, name: 'Ascending Stair', rows: [2, 1, 0, 1, 2] },
  { id: 6, name: 'Crown Arc', rows: [0, 0, 1, 0, 0] },
  { id: 7, name: 'Root Arc', rows: [2, 2, 1, 2, 2] },
  { id: 8, name: 'Rising Flame', rows: [1, 0, 0, 0, 1] },
  { id: 9, name: 'Falling Ember', rows: [1, 2, 2, 2, 1] },
  { id: 10, name: 'Jade Wave', rows: [0, 1, 1, 1, 0] },
  { id: 11, name: 'Ember Wave', rows: [2, 1, 1, 1, 2] },
  { id: 12, name: 'Twin Peaks', rows: [1, 0, 1, 0, 1] },
  { id: 13, name: 'Twin Wells', rows: [1, 2, 1, 2, 1] },
  { id: 14, name: 'Moon Gate', rows: [0, 0, 2, 0, 0] },
  { id: 15, name: 'Cliff Gate', rows: [2, 2, 0, 2, 2] },
  { id: 16, name: 'Serpent Left', rows: [0, 1, 0, 1, 0] },
  { id: 17, name: 'Serpent Right', rows: [2, 1, 2, 1, 2] },
  { id: 18, name: 'Guardian Cross', rows: [1, 0, 2, 0, 1] },
  { id: 19, name: 'Warden Cross', rows: [1, 2, 0, 2, 1] },
  { id: 20, name: 'Summit Line', rows: [0, 2, 0, 2, 0] },
];

export const PAYLINE_COUNT = PAYLINES.length;
