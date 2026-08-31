/**
 * Canvas helpers shared by every procedural drawing routine.
 *
 * The symbol art is built from three moves — `sculpt` turns a flat path into a
 * lit solid, `cutGem` renders a faceted stone, and `embossText` presses a
 * letterform into metal. Everything else is composition.
 */

export type Ctx2D = CanvasRenderingContext2D;
export type PathFn = (ctx: Ctx2D) => void;

/* -------------------------------------------------------------------------- */
/*  Paths                                                                     */
/* -------------------------------------------------------------------------- */

export function roundedRectPath(
  ctx: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function octagonPath(ctx: Ctx2D, x: number, y: number, w: number, h: number, cut: number): void {
  ctx.beginPath();
  ctx.moveTo(x + cut, y);
  ctx.lineTo(x + w - cut, y);
  ctx.lineTo(x + w, y + cut);
  ctx.lineTo(x + w, y + h - cut);
  ctx.lineTo(x + w - cut, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.lineTo(x, y + h - cut);
  ctx.lineTo(x, y + cut);
  ctx.closePath();
}

export function polygonPath(ctx: Ctx2D, cx: number, cy: number, r: number, sides: number, rotation = 0): void {
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (i / sides) * Math.PI * 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function starPath(
  ctx: Ctx2D,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points: number,
  rotation = -Math.PI / 2,
): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = rotation + (i / (points * 2)) * Math.PI * 2;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/* -------------------------------------------------------------------------- */
/*  Colour                                                                    */
/* -------------------------------------------------------------------------- */

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = Number.parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Polished gold: the double bright band is what sells it as metal. */
export function goldGradient(ctx: Ctx2D, x0 = 14, y0 = 4, x1 = 88, y1 = 96): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, '#FFFBEE');
  g.addColorStop(0.14, '#FFE9AE');
  g.addColorStop(0.32, '#F8C65B');
  g.addColorStop(0.5, '#C8912B');
  g.addColorStop(0.68, '#7E5A12');
  g.addColorStop(0.84, '#E7BC55');
  g.addColorStop(1, '#FFF3CE');
  return g;
}

/** Three-stop material ramp used for jade, silver, stone and gems. */
export function materialGradient(
  ctx: Ctx2D,
  light: string,
  mid: string,
  dark: string,
  x0 = 16,
  y0 = 6,
  x1 = 86,
  y1 = 96,
): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, light);
  g.addColorStop(0.34, mid);
  g.addColorStop(0.74, dark);
  g.addColorStop(1, mid);
  return g;
}

/* -------------------------------------------------------------------------- */
/*  Shading                                                                   */
/* -------------------------------------------------------------------------- */

export interface SculptOptions {
  /** Explicit fill. Falls back to a ramp built from light/mid/dark. */
  fill?: CanvasGradient | string;
  light?: string;
  mid?: string;
  dark?: string;
  /** Contact shadow under the form. */
  shadow?: boolean;
  shadowBlur?: number;
  /** Strength of the top-left sheen, 0–1. */
  gloss?: number;
  /** Strength of the bottom-right occlusion, 0–1. */
  occlusion?: number;
  outline?: string;
  outlineWidth?: number;
  rim?: string;
  rimWidth?: number;
}

/**
 * Turns a flat path into a lit solid: drop shadow, graded body, bottom-right
 * occlusion, top-left sheen, dark contour and a rim light that fades around
 * the form. This is what separates a rendered object from a sticker.
 */
export function sculpt(ctx: Ctx2D, path: PathFn, options: SculptOptions = {}): void {
  const {
    fill,
    light = '#FFFFFF',
    mid = '#8FA3C4',
    dark = '#2A3550',
    shadow = true,
    shadowBlur = 9,
    gloss = 0.55,
    occlusion = 0.45,
    outline = 'rgba(3,7,14,0.9)',
    outlineWidth = 2.4,
    rim = 'rgba(255,255,255,0.9)',
    rimWidth = 1.5,
  } = options;

  if (shadow) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    path(ctx);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  path(ctx);
  ctx.clip();

  ctx.fillStyle = fill ?? materialGradient(ctx, light, mid, dark);
  ctx.fillRect(-30, -30, 160, 160);

  if (occlusion > 0) {
    const occ = ctx.createRadialGradient(80, 88, 3, 46, 50, 82);
    occ.addColorStop(0, `rgba(0,0,0,${0.5 * occlusion})`);
    occ.addColorStop(0.55, `rgba(0,0,0,${0.18 * occlusion})`);
    occ.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = occ;
    ctx.fillRect(-30, -30, 160, 160);
  }

  if (gloss > 0) {
    const sheen = ctx.createRadialGradient(34, 24, 2, 42, 34, 56);
    sheen.addColorStop(0, `rgba(255,255,255,${0.6 * gloss})`);
    sheen.addColorStop(0.45, `rgba(255,255,255,${0.14 * gloss})`);
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(-30, -30, 160, 160);
  }
  ctx.restore();

  ctx.save();
  ctx.lineJoin = 'round';
  path(ctx);
  ctx.lineWidth = outlineWidth;
  ctx.strokeStyle = outline;
  ctx.stroke();

  const rimGrad = ctx.createLinearGradient(18, 8, 84, 92);
  rimGrad.addColorStop(0, rim);
  rimGrad.addColorStop(0.42, 'rgba(255,255,255,0.16)');
  rimGrad.addColorStop(1, 'rgba(255,255,255,0)');
  path(ctx);
  ctx.lineWidth = rimWidth;
  ctx.strokeStyle = rimGrad;
  ctx.stroke();
  ctx.restore();
}

/** A hot highlight blob — the last 5% that makes a surface look wet. */
export function specular(
  ctx: Ctx2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation = -0.5,
  alpha = 0.85,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(255,255,255,${alpha})`);
  g.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.35})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export interface GemColors {
  light: string;
  mid: string;
  dark: string;
  glow: string;
}

/**
 * A brilliant-cut stone: crown facets around a flat table, each catching a
 * different amount of light, finished with a rim and a specular.
 */
export function cutGem(
  ctx: Ctx2D,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotation: number,
  colors: GemColors,
): void {
  const outline = (c: Ctx2D) => polygonPath(c, cx, cy, radius, sides, rotation);
  const tableR = radius * 0.56;

  sculpt(ctx, outline, {
    light: colors.light,
    mid: colors.mid,
    dark: colors.dark,
    gloss: 0.3,
    occlusion: 0.55,
    outline: hexToRgba('#04070E', 0.85),
    outlineWidth: 2,
    rimWidth: 1.6,
  });

  // Crown facets between the girdle and the table
  ctx.save();
  outline(ctx);
  ctx.clip();
  for (let i = 0; i < sides; i += 1) {
    const a0 = rotation + (i / sides) * Math.PI * 2;
    const a1 = rotation + ((i + 1) / sides) * Math.PI * 2;
    const mAngle = (a0 + a1) / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a0) * radius, cy + Math.sin(a0) * radius);
    ctx.lineTo(cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius);
    ctx.lineTo(cx + Math.cos(mAngle) * tableR, cy + Math.sin(mAngle) * tableR);
    ctx.closePath();
    // Facets facing the light read bright, the far side reads deep.
    const facing = Math.cos(mAngle + Math.PI * 0.75);
    ctx.fillStyle =
      facing > 0 ? `rgba(255,255,255,${0.1 + facing * 0.26})` : `rgba(0,0,0,${0.1 - facing * 0.3})`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // Table
  polygonPath(ctx, cx, cy, tableR, sides, rotation);
  const table = ctx.createLinearGradient(cx - tableR, cy - tableR, cx + tableR, cy + tableR);
  table.addColorStop(0, hexToRgba(colors.light, 0.95));
  table.addColorStop(0.5, hexToRgba(colors.mid, 0.9));
  table.addColorStop(1, hexToRgba(colors.dark, 0.9));
  ctx.fillStyle = table;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.restore();

  specular(ctx, cx - radius * 0.3, cy - radius * 0.36, radius * 0.3, radius * 0.16, -0.6, 0.9);
}

/** Presses a letterform into metal: cast shadow, graded face, lit top edge. */
export function embossText(
  ctx: Ctx2D,
  text: string,
  cx: number,
  cy: number,
  fontSize: number,
  fill?: CanvasGradient | string,
): void {
  ctx.save();
  ctx.font = `700 ${fontSize}px "Cinzel Decorative", Cinzel, Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText(text, cx + 1.6, cy + 2.4);

  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(6,10,20,0.75)';
  ctx.strokeText(text, cx, cy);

  ctx.fillStyle = fill ?? goldGradient(ctx, cx - fontSize * 0.5, cy - fontSize * 0.55, cx + fontSize * 0.4, cy + fontSize * 0.5);
  ctx.fillText(text, cx, cy);

  ctx.lineWidth = 1.1;
  ctx.strokeStyle = 'rgba(255,252,235,0.75)';
  ctx.strokeText(text, cx - 0.5, cy - 0.9);
  ctx.restore();
}

export function withGlow(ctx: Ctx2D, color: string, blur: number, draw: () => void): void {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  draw();
  ctx.restore();
}

export function radialGlow(
  ctx: Ctx2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  strength = 0.5,
): void {
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, hexToRgba(color, strength));
  gradient.addColorStop(0.55, hexToRgba(color, strength * 0.28));
  gradient.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}
