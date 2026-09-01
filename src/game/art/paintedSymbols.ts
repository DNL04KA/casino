import type { SymbolId } from '@/types';
import highUrl from '@/assets/symbols-high.png';
import specialUrl from '@/assets/symbols-special.png';

/**
 * Painted artwork, delivered as two 2 × 2 sheets.
 *
 * The low-pay ranks stay procedural: cut gems in gold settings are exactly what
 * vector rendering is best at, and the genre splits the work the same way —
 * stones for the low ranks, painted objects for the high ones. Only the
 * guardians and the specials needed illustration, so only they ship as pixels.
 */

export type SheetName = 'high' | 'special';

const CELL = 320;

export interface PaintedCell {
  sheet: SheetName;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

const cell = (sheet: SheetName, col: number, row: number): PaintedCell => ({
  sheet,
  sx: col * CELL,
  sy: row * CELL,
  sw: CELL,
  sh: CELL,
});

export const PAINTED_CELLS: Partial<Record<SymbolId, PaintedCell>> = {
  dragon: cell('high', 0, 0),
  mask: cell('high', 1, 0),
  empress: cell('high', 0, 1),
  tiger: cell('high', 1, 1),
  wild: cell('special', 0, 0),
  scatter: cell('special', 1, 0),
  mystery: cell('special', 0, 1),
};

/** The fourth special cell is a treasure chest, used by the relic mini-game. */
export const RELIC_CHEST_CELL: PaintedCell = cell('special', 1, 1);

/* -------------------------------------------------------------------------- */
/*  Background keying                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Softens the one-pixel seam left where the artwork met its backdrop, so
 * nothing keeps a coloured fringe.
 */
function erodeEdges(data: Uint8ClampedArray, removed: Uint8Array, w: number, h: number): void {
  for (let py = 1; py < h - 1; py += 1) {
    for (let px = 1; px < w - 1; px += 1) {
      const p = py * w + px;
      if (removed[p]) continue;
      const neighbours =
        (removed[p - 1] ?? 0) + (removed[p + 1] ?? 0) + (removed[p - w] ?? 0) + (removed[p + w] ?? 0);
      if (neighbours >= 2) data[p * 4 + 3] = Math.round((data[p * 4 + 3] as number) * 0.45);
      else if (neighbours === 1) data[p * 4 + 3] = Math.round((data[p * 4 + 3] as number) * 0.8);
    }
  }
}

type BackdropTest = (data: Uint8ClampedArray, i: number) => boolean;

/**
 * Floods inward from the border and clears whatever the test calls backdrop.
 *
 * Reachability rather than colour alone is the reliable signal: the backdrop is
 * one connected region touching the edge, while a matching tone *inside* a
 * symbol is enclosed by paint and therefore never reached.
 */
function keyByFlood(image: HTMLImageElement, isBackdrop: BackdropTest): HTMLCanvasElement | null {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  if (w === 0 || h === 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0);
  let frame: ImageData;
  try {
    frame = ctx.getImageData(0, 0, w, h);
  } catch {
    return null;
  }
  const data = frame.data;

  const removed = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const push = (px: number, py: number) => {
    const p = py * w + px;
    if (removed[p] || !isBackdrop(data, p * 4)) return;
    removed[p] = 1;
    queue[tail++] = p;
  };

  for (let px = 0; px < w; px += 1) {
    push(px, 0);
    push(px, h - 1);
  }
  for (let py = 0; py < h; py += 1) {
    push(0, py);
    push(w - 1, py);
  }

  while (head < tail) {
    const p = queue[head++] as number;
    const px = p % w;
    const py = (p / w) | 0;
    if (px > 0) push(px - 1, py);
    if (px < w - 1) push(px + 1, py);
    if (py > 0) push(px, py - 1);
    if (py < h - 1) push(px, py + 1);
  }

  for (let p = 0; p < removed.length; p += 1) {
    if (removed[p]) data[p * 4 + 3] = 0;
  }
  erodeEdges(data, removed, w, h);

  ctx.putImageData(frame, 0, 0);
  return canvas;
}

/**
 * The guardian sheet came back with a painted checkerboard standing in for
 * transparency. It uses two greys (~140 and ~182), and the empress's silver
 * robe sits in the same range, which is why this keys by reachability.
 */
const isCheckerboard: BackdropTest = (data, i) => {
  const r = data[i] as number;
  const g = data[i + 1] as number;
  const b = data[i + 2] as number;
  if (Math.max(r, g, b) - Math.min(r, g, b) > 22) return false;
  const luma = (r + g + b) / 3;
  return luma > 108 && luma < 205;
};

/** The specials sheet was generated on flat magenta, which keys cleanly. */
const isMagenta: BackdropTest = (data, i) => {
  const r = data[i] as number;
  const g = data[i + 1] as number;
  const b = data[i + 2] as number;
  return r > 150 && b > 150 && g < 120 && r - g > 60 && b - g > 60;
};

/* -------------------------------------------------------------------------- */
/*  Loading                                                                   */
/* -------------------------------------------------------------------------- */

const sheets: Partial<Record<SheetName, CanvasImageSource>> = {};
let pending = 2;
let ready = false;
const listeners = new Set<() => void>();

function announce(): void {
  ready = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

function load(name: SheetName, url: string, test: BackdropTest): void {
  const image = new Image();
  image.decoding = 'async';
  const settle = () => {
    sheets[name] = keyByFlood(image, test) ?? image;
    pending -= 1;
    if (pending <= 0) announce();
  };
  // A missing sheet must not take the symbols down — the procedural glyphs are
  // still there to fall back on.
  image.onerror = () => {
    pending -= 1;
    if (pending <= 0) announce();
  };
  image.src = url;
  if (image.complete) settle();
  else image.onload = settle;
}

if (typeof window !== 'undefined') {
  load('high', highUrl, isCheckerboard);
  load('special', specialUrl, isMagenta);
}

/** The keyed sheet, or null while it is still loading. */
export function getPaintedSheet(name: SheetName): CanvasImageSource | null {
  return sheets[name] ?? null;
}

export function isPaintedReady(): boolean {
  return ready;
}

/** Runs `listener` once the sheets are usable (immediately if they already are). */
export function onPaintedReady(listener: () => void): () => void {
  if (ready) {
    listener();
    return () => {};
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}
