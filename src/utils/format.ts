const creditFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const preciseFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Virtual demo credits — never a currency. */
export function formatCredits(value: number): string {
  return creditFormatter.format(Math.max(0, Math.round(value)));
}

export function formatPrecise(value: number): string {
  return preciseFormatter.format(value);
}

export function formatMultiplier(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `×${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
