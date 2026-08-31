import { GRID_COLUMNS, GRID_ROWS } from '@/data/config';

/** Internal render resolution of the Phaser reel stage (scaled to fit). */
export const VIEW_WIDTH = 1200;
export const VIEW_HEIGHT = 700;

export const CELL_WIDTH = 216;
export const CELL_HEIGHT = 200;

export const GRID_WIDTH = CELL_WIDTH * GRID_COLUMNS;
export const GRID_HEIGHT = CELL_HEIGHT * GRID_ROWS;

export const ORIGIN_X = (VIEW_WIDTH - GRID_WIDTH) / 2;
export const ORIGIN_Y = (VIEW_HEIGHT - GRID_HEIGHT) / 2;

/** Texture resolution and on-screen size of a symbol tile. */
export const TILE_TEXTURE_SIZE = 224;
export const TILE_DISPLAY_SIZE = 194;

/** Sprites per reel: one hidden above, three visible, one hidden below. */
export const REEL_SLOTS = GRID_ROWS + 2;

export const REEL_MAX_SPEED = 3.4; // px per ms
export const REEL_ANTICIPATION_SPEED = 1.1;

export function cellX(reel: number): number {
  return ORIGIN_X + reel * CELL_WIDTH + CELL_WIDTH / 2;
}

export function cellY(row: number): number {
  return ORIGIN_Y + row * CELL_HEIGHT + CELL_HEIGHT / 2;
}
