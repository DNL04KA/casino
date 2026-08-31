import { getSymbol } from '@/data/symbols';
import type { SymbolId } from '@/types';
import { GLYPHS } from './glyphs';
import { hexToRgba, roundedRectPath, starPath, type Ctx2D } from './primitives';

export interface TileOptions {
  /** Extra glow strength, 0–1. */
  intensity?: number;
  /** When false the canvas is not cleared first (used to stack blur passes). */
  clear?: boolean;
}

/**
 * Renders one symbol into an arbitrary 2D context at `size` × `size`.
 *
 * Symbols are free-standing objects — no plate, no frame. What separates them
 * from the reel background is a coloured bloom behind the form and a contact
 * shadow underneath, which is what makes them read as physical props.
 *
 * Shared by the Phaser reel textures and the React paytable cards so the art
 * only ever exists in one place.
 */
export function drawSymbolTile(
  ctx: Ctx2D,
  id: SymbolId,
  size: number,
  options: TileOptions = {},
): void {
  const { intensity = 1, clear = true } = options;
  const def = getSymbol(id);
  const { palette } = def;

  ctx.save();
  if (clear) ctx.clearRect(0, 0, size, size);

  // Coloured bloom behind the object
  const bloom = ctx.createRadialGradient(
    size * 0.5,
    size * 0.48,
    size * 0.06,
    size * 0.5,
    size * 0.5,
    size * 0.56,
  );
  bloom.addColorStop(0, hexToRgba(palette.glow, 0.34 * intensity));
  bloom.addColorStop(0.45, hexToRgba(palette.glow, 0.14 * intensity));
  bloom.addColorStop(1, hexToRgba(palette.glow, 0));
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, size, size);

  // A whisper of the symbol's own shade seats it on the reel. Kept faint and
  // tight: at this tile size a stronger pool overlaps its neighbours and
  // quilts the whole board with dark patches.
  const pool = ctx.createRadialGradient(
    size * 0.5,
    size * 0.54,
    size * 0.02,
    size * 0.5,
    size * 0.54,
    size * 0.34,
  );
  pool.addColorStop(0, hexToRgba(palette.shade, 0.2 * intensity));
  pool.addColorStop(1, hexToRgba(palette.shade, 0));
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, size, size);

  // Contact shadow
  ctx.save();
  ctx.globalAlpha = 0.34;
  const shade = ctx.createRadialGradient(
    size * 0.5,
    size * 0.88,
    size * 0.02,
    size * 0.5,
    size * 0.88,
    size * 0.3,
  );
  shade.addColorStop(0, 'rgba(0,0,0,0.6)');
  shade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 0.88, size * 0.3, size * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // The object itself, drawn in its own 100 × 100 design space
  const scale = (size * 0.96) / 100;
  ctx.save();
  ctx.translate(size / 2 - 50 * scale, size / 2 - 50 * scale);
  ctx.scale(scale, scale);
  ctx.save();
  ctx.shadowColor = hexToRgba(palette.glow, 0.4 * intensity);
  ctx.shadowBlur = 12;
  GLYPHS[id](ctx, palette);
  ctx.restore();
  ctx.restore();

  ctx.restore();
}

/** Soft radial sprite used for sparks, dust and win glows. */
export function drawSoftDot(ctx: Ctx2D, size: number, color = '#FFFFFF'): void {
  const r = size / 2;
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
  gradient.addColorStop(0, hexToRgba(color, 1));
  gradient.addColorStop(0.35, hexToRgba(color, 0.55));
  gradient.addColorStop(1, hexToRgba(color, 0));
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
}

/** Four-point star used for gold sparkle bursts. */
export function drawSparkle(ctx: Ctx2D, size: number, color = '#FFE9AE'): void {
  const c = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.25;
  starPath(ctx, c, c, c * 0.95, c * 0.16, 4);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(c, c, size * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
}

/**
 * A Rune Orb: a glass sphere drawn in neutral tones so Phaser can tint it per
 * value tier without muddying the highlights.
 */
export function drawOrb(ctx: Ctx2D, size: number): void {
  const c = size / 2;
  ctx.clearRect(0, 0, size, size);

  // Outer aura
  const aura = ctx.createRadialGradient(c, c, size * 0.26, c, c, c);
  aura.addColorStop(0, 'rgba(255,255,255,0.55)');
  aura.addColorStop(0.55, 'rgba(255,255,255,0.16)');
  aura.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, size, size);

  // Sphere body
  const body = ctx.createRadialGradient(c - size * 0.14, c - size * 0.18, size * 0.04, c, c, size * 0.36);
  body.addColorStop(0, '#FFFFFF');
  body.addColorStop(0.35, '#DCE6F5');
  body.addColorStop(0.72, '#8FA3C4');
  body.addColorStop(1, '#3A4763');
  ctx.beginPath();
  ctx.arc(c, c, size * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();

  // Rim light
  ctx.beginPath();
  ctx.arc(c, c, size * 0.355, Math.PI * 0.15, Math.PI * 0.85);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = size * 0.02;
  ctx.stroke();

  // Gold collar
  ctx.beginPath();
  ctx.arc(c, c, size * 0.4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = size * 0.028;
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(c + Math.cos(a) * size * 0.4, c + Math.sin(a) * size * 0.4, size * 0.022, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
  }

  // Specular highlight
  ctx.beginPath();
  ctx.ellipse(c - size * 0.11, c - size * 0.15, size * 0.09, size * 0.055, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
}

/** A faint temple rune, drifting behind the reels to give the board depth. */
export function drawRuneMark(ctx: Ctx2D, size: number, variant: number): void {
  ctx.clearRect(0, 0, size, size);
  const u = size / 100;
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 7 * u;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (variant % 4) {
    case 0:
      ctx.moveTo(50 * u, 12 * u);
      ctx.lineTo(50 * u, 88 * u);
      ctx.moveTo(50 * u, 34 * u);
      ctx.lineTo(24 * u, 16 * u);
      ctx.moveTo(50 * u, 54 * u);
      ctx.lineTo(78 * u, 32 * u);
      break;
    case 1:
      ctx.moveTo(24 * u, 14 * u);
      ctx.lineTo(24 * u, 86 * u);
      ctx.lineTo(66 * u, 86 * u);
      ctx.moveTo(24 * u, 48 * u);
      ctx.lineTo(60 * u, 48 * u);
      break;
    case 2:
      ctx.moveTo(26 * u, 86 * u);
      ctx.lineTo(50 * u, 14 * u);
      ctx.lineTo(74 * u, 86 * u);
      ctx.moveTo(34 * u, 62 * u);
      ctx.lineTo(66 * u, 62 * u);
      break;
    default:
      ctx.moveTo(30 * u, 16 * u);
      ctx.lineTo(70 * u, 50 * u);
      ctx.lineTo(30 * u, 84 * u);
      ctx.moveTo(70 * u, 16 * u);
      ctx.lineTo(70 * u, 84 * u);
      break;
  }
  ctx.stroke();
  ctx.restore();
}

/** A soft diagonal shaft of light that sweeps behind the board. */
export function drawLightShaft(ctx: Ctx2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
  const g = ctx.createLinearGradient(0, 0, width, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.75)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  // Fade the ends so the shaft has no hard cut-off.
  const fade = ctx.createLinearGradient(0, 0, 0, height);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(0.5, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}

/** Expanding shockwave ring thrown off by a winning symbol. */
export function drawShockRing(ctx: Ctx2D, size: number): void {
  ctx.clearRect(0, 0, size, size);
  const c = size / 2;
  const g = ctx.createRadialGradient(c, c, size * 0.3, c, c, c * 0.98);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.62, 'rgba(255,255,255,0)');
  g.addColorStop(0.78, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.9, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();
}

/** Rounded halo used behind winning symbols. */
export function drawWinHalo(ctx: Ctx2D, size: number, color: string): void {
  ctx.clearRect(0, 0, size, size);
  const pad = size * 0.06;
  const inner = size - pad * 2;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.22;
  roundedRectPath(ctx, pad, pad, inner, inner, inner * 0.2);
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.035;
  ctx.stroke();
  ctx.restore();
  const glow = ctx.createRadialGradient(size / 2, size / 2, size * 0.12, size / 2, size / 2, size * 0.55);
  glow.addColorStop(0, hexToRgba(color, 0.35));
  glow.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
}
