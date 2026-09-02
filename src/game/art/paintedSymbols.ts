import type { SymbolId } from '@/types';
import highUrl from '@/assets/symbols-high.jpg';
import lowUrl from '@/assets/symbols-low.jpg';
import extraUrl from '@/assets/symbols-extra.jpg';

/**
 * Painted artwork, delivered as two 2 × 2 sheets.
 *
 * The low-pay ranks stay procedural: cut gems in gold settings are exactly what
 * vector rendering is best at, and the genre splits the work the same way —
 * stones for the low ranks, painted objects for the high ones. Only the
 * guardians and the specials needed illustration, so only they ship as pixels.
 */

export type SheetName = 'high' | 'low' | 'extra';

export interface PaintedCell {
  sheet: SheetName;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Cells were measured from the delivered sheets rather than assumed: the
 * generator does not lay symbols out on an even grid, it centres each one
 * loosely in its own area. A connected-component pass over the keyed artwork
 * produced these bounds. The padding is deliberate — surrounding backdrop is
 * keyed away anyway, and a clipped anti-aliased edge is what actually shows.
 */
const PAD = 8;

const cell = (sheet: SheetName, sx: number, sy: number, sw: number, sh: number): PaintedCell => ({
  sheet,
  sx: Math.max(0, sx - PAD),
  sy: Math.max(0, sy - PAD),
  sw: sw + PAD * 2,
  sh: sh + PAD * 2,
});

export const PAINTED_CELLS: Partial<Record<SymbolId, PaintedCell>> = {
  // Guests
  kasa: cell('high', 317, 28, 348, 345),
  kitsune: cell('high', 733, 25, 344, 345),
  okami: cell('high', 402, 401, 235, 348),
  tanuki: cell('high', 764, 402, 268, 342),
  // Service
  teapot: cell('low', 93, 46, 290, 298),
  cup: cell('low', 639, 137, 143, 196),
  lantern: cell('low', 1081, 42, 188, 314),
  fan: cell('low', 69, 454, 358, 238),
  incense: cell('low', 598, 443, 224, 278),
  // The koban rode in on the service sheet
  wild: cell('low', 1086, 450, 209, 252),
  // The two that carry the features
  scatter: cell('extra', 137, 62, 438, 282),
  mystery: cell('extra', 916, 52, 230, 295),
};

/** A wrapped furoshiki bundle — the face of every parcel in the mini-game. */
export const PARCEL_CELL: PaintedCell = cell('extra', 863, 436, 331, 271);

/** A roadside jizo, held for a future feature. */
export const JIZO_CELL: PaintedCell = cell('extra', 253, 417, 182, 301);

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

  // Backdrop enclosed by artwork — the gap under a teapot handle, the hole in
  // a fan rivet — is never reachable from the border. Magenta appears nowhere
  // in the artwork itself, so a second global pass is safe and catches those.
  for (let p = 0; p < removed.length; p += 1) {
    if (!removed[p] && isBackdrop(data, p * 4)) removed[p] = 1;
  }

  for (let p = 0; p < removed.length; p += 1) {
    if (removed[p]) data[p * 4 + 3] = 0;
  }
  erodeEdges(data, removed, w, h);

  ctx.putImageData(frame, 0, 0);
  return canvas;
}

/**
 * Both sheets were generated on flat magenta. They arrive as JPEG, so the key
 * must tolerate compression ringing around every edge — hence the loose
 * thresholds, with the erosion pass clearing what survives.
 */
const isMagenta: BackdropTest = (data, i) => {
  const r = data[i] as number;
  const g = data[i + 1] as number;
  const b = data[i + 2] as number;
  return r > 140 && b > 140 && g < 140 && r - g > 45 && b - g > 45;
};

/* -------------------------------------------------------------------------- */
/*  Loading                                                                   */
/* -------------------------------------------------------------------------- */

const sheets: Partial<Record<SheetName, CanvasImageSource>> = {};
let pending = 3;
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
  load('high', highUrl, isMagenta);
  load('low', lowUrl, isMagenta);
  load('extra', extraUrl, isMagenta);
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
