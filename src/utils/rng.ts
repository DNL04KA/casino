/**
 * Small deterministic-friendly RNG helpers.
 *
 * This is a *presentation* randomiser for a visual prototype. It is not a
 * certified RNG and must never be used to determine anything of value.
 */

export type RandomFn = () => number;

/** mulberry32 — tiny, fast, good enough for animation-driven demos. */
export function createSeededRandom(seed: number): RandomFn {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const defaultRandom: RandomFn = Math.random;

export function randomInt(max: number, rng: RandomFn = defaultRandom): number {
  return Math.floor(rng() * max);
}

export function randomRange(min: number, max: number, rng: RandomFn = defaultRandom): number {
  return min + rng() * (max - min);
}

export function pick<T>(items: readonly T[], rng: RandomFn = defaultRandom): T {
  return items[randomInt(items.length, rng)] as T;
}

export function shuffle<T>(items: readonly T[], rng: RandomFn = defaultRandom): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1, rng);
    const a = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = a;
  }
  return copy;
}

/** Weighted pick over a `{ key: weight }` map. */
export function weightedPick<K extends string>(
  weights: Record<K, number>,
  rng: RandomFn = defaultRandom,
): K {
  const entries = Object.entries(weights) as [K, number][];
  let total = 0;
  for (const [, w] of entries) total += w;
  let roll = rng() * total;
  for (const [key, w] of entries) {
    roll -= w;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1]![0];
}

export function chance(probability: number, rng: RandomFn = defaultRandom): boolean {
  return rng() < probability;
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
