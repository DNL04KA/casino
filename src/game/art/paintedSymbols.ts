import type { SymbolId } from '@/types';
import sheetUrl from '@/assets/symbols-high.png';

/**
 * Painted artwork for the high-pay symbols, delivered as one 2 × 2 sheet.
 *
 * The low-pay ranks stay procedural: cut gems in gold settings are exactly what
 * vector rendering is best at, and that is how the genre splits the work too —
 * stones for the low ranks, painted objects for the high ones. Only the four
 * guardians needed illustration, so only they are shipped as pixels.
 */

const CELL = 320;

export interface PaintedCell {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const PAINTED_CELLS: Partial<Record<SymbolId, PaintedCell>> = {
  dragon: { sx: 0, sy: 0, sw: CELL, sh: CELL },
  mask: { sx: CELL, sy: 0, sw: CELL, sh: CELL },
  empress: { sx: 0, sy: CELL, sw: CELL, sh: CELL },
  tiger: { sx: CELL, sy: CELL, sw: CELL, sh: CELL },
};

/**
 * The generator paints a checkerboard to *depict* transparency instead of
 * writing an alpha channel, so the sheet arrives fully opaque.
 *
 * A plain colour key is not safe here: the checker uses two greys (~140 and
 * ~182) and the symbols contain neutral tones in the same range — the empress's
 * silver robe would be cut along with the background. So this floods inward
 * from the border instead. The checker is one connected region touching the
 * edge, while every neutral tone inside a symbol is enclosed by painted pixels,
 * which makes reachability the reliable test rather than colour alone.
 */
function keyOutCheckerboard(image: HTMLImageElement): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || w === 0 || h === 0) return null;

  ctx.drawImage(image, 0, 0);
  let frame: ImageData;
  try {
    frame = ctx.getImageData(0, 0, w, h);
  } catch {
    return null;
  }
  const data = frame.data;

  const isBackdrop = (i: number): boolean => {
    const r = data[i] as number;
    const g = data[i + 1] as number;
    const b = data[i + 2] as number;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (chroma > 22) return false;
    const luma = (r + g + b) / 3;
    return luma > 108 && luma < 205;
  };

  const removed = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const push = (px: number, py: number) => {
    const p = py * w + px;
    if (removed[p]) return;
    if (!isBackdrop(p * 4)) return;
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

  // Clear the flooded region, then soften the one-pixel seam the checker
  // leaves behind on anti-aliased edges.
  for (let p = 0; p < removed.length; p += 1) {
    if (removed[p]) data[p * 4 + 3] = 0;
  }
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

  ctx.putImageData(frame, 0, 0);
  return canvas;
}

let sheet: HTMLImageElement | HTMLCanvasElement | null = null;
let ready = false;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  const image = new Image();
  image.decoding = 'async';
  image.src = sheetUrl;
  const settle = () => {
    sheet = keyOutCheckerboard(image) ?? image;
    ready = true;
    listeners.forEach((listener) => listener());
    listeners.clear();
  };
  if (image.complete) settle();
  else {
    image.onload = settle;
    // A missing sheet must not take the symbols down — the procedural glyphs
    // are still there to fall back on.
    image.onerror = () => {
      ready = false;
      listeners.clear();
    };
  }
}

/** The keyed sheet, or null while it is still loading. */
export function getPaintedSheet(): CanvasImageSource | null {
  return ready ? sheet : null;
}

export function isPaintedReady(): boolean {
  return ready;
}

/** Runs `listener` once the sheet is usable (immediately if it already is). */
export function onPaintedReady(listener: () => void): () => void {
  if (ready) {
    listener();
    return () => {};
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}
