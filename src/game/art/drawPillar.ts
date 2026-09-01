import { goldGradient, hexToRgba, sculpt, specular, type Ctx2D } from './primitives';

/**
 * Carved side panels for the cabinet.
 *
 * These replace an earlier attempt at sculpted guardian figures. Procedural
 * drawing is poor at anatomy and excellent at ornament, so the panels lean the
 * other way: engine-turned rosettes, beaded gold bands and recessed niches,
 * all built from the same sculpting toolkit as the symbols. The geometry is
 * mathematical, which is exactly why it reads as precise craft rather than as
 * a rough drawing.
 */

/**
 * A guilloché rosette — the engine-turned figure found on watch dials and
 * banknotes. `petals` sets the lobe count, `depth` how far they swing.
 */
function guilloche(
  ctx: Ctx2D,
  cx: number,
  cy: number,
  radius: number,
  petals: number,
  depth: number,
  turns: number,
  drift: number,
): void {
  ctx.beginPath();
  const step = 0.02;
  for (let t = 0; t <= Math.PI * 2 * turns; t += step) {
    const r = radius + depth * Math.cos(petals * t) + drift * t;
    const x = cx + Math.cos(t) * r;
    const y = cy + Math.sin(t) * r;
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/** A gold-framed medallion with an engine-turned centre. */
function rosette(ctx: Ctx2D, cx: number, cy: number, radius: number, accent: string): void {
  // Recessed bed
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  const bed = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.35, radius * 0.1, cx, cy, radius);
  bed.addColorStop(0, '#16203A');
  bed.addColorStop(0.65, '#0B1224');
  bed.addColorStop(1, '#05080F');
  ctx.fillStyle = bed;
  ctx.fill();
  ctx.clip();

  // Engine turning, two passes at different frequencies
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = hexToRgba(accent, 0.85);
  guilloche(ctx, cx, cy, radius * 0.64, 7, radius * 0.2, 7, 0);
  ctx.strokeStyle = hexToRgba('#F8C65B', 0.7);
  guilloche(ctx, cx, cy, radius * 0.46, 11, radius * 0.14, 6, radius * 0.012);
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = hexToRgba('#FFFFFF', 0.28);
  guilloche(ctx, cx, cy, radius * 0.3, 5, radius * 0.1, 5, radius * 0.01);
  ctx.restore();

  // Gold bezel with beading
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.lineWidth = radius * 0.16;
  ctx.strokeStyle = goldGradient(ctx, cx - radius, cy - radius, cx + radius, cy + radius);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(10,7,2,0.7)';
  ctx.stroke();
  ctx.restore();

  const beads = 16;
  for (let i = 0; i < beads; i += 1) {
    const a = (i / beads) * Math.PI * 2;
    const bx = cx + Math.cos(a) * radius;
    const by = cy + Math.sin(a) * radius;
    ctx.beginPath();
    ctx.arc(bx, by, radius * 0.075, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(70,46,8,0.55)';
    ctx.fill();
    specular(ctx, bx - radius * 0.02, by - radius * 0.025, radius * 0.05, radius * 0.035, 0, 0.75);
  }

  // Centre stone
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.16, 0, Math.PI * 2);
  const core = ctx.createRadialGradient(cx - radius * 0.05, cy - radius * 0.06, 0, cx, cy, radius * 0.16);
  core.addColorStop(0, '#FFFFFF');
  core.addColorStop(0.4, accent);
  core.addColorStop(1, hexToRgba(accent, 0.25));
  ctx.fillStyle = core;
  ctx.fill();
}

/**
 * A Greek-key meander, drawn as one continuous stroke down the shaft. Pure
 * geometry, so it is perfectly regular — the kind of ornament that looks
 * expensive precisely because a hand could not keep it that even.
 */
function meander(ctx: Ctx2D, x: number, top: number, bottom: number, unit: number, accent: string): void {
  ctx.save();
  ctx.lineWidth = Math.max(1, unit * 0.22);
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'square';
  ctx.strokeStyle = hexToRgba(accent, 0.5);
  ctx.beginPath();
  let y = top;
  let flip = 1;
  ctx.moveTo(x, y);
  while (y + unit * 4 < bottom) {
    // One key: out, down, back, down, out again — mirrored each repeat.
    ctx.lineTo(x + unit * 2 * flip, y);
    ctx.lineTo(x + unit * 2 * flip, y + unit * 2);
    ctx.lineTo(x + unit * 0.7 * flip, y + unit * 2);
    ctx.lineTo(x + unit * 0.7 * flip, y + unit);
    ctx.lineTo(x + unit * 1.3 * flip, y + unit);
    ctx.moveTo(x, y + unit * 2);
    ctx.lineTo(x, y + unit * 4);
    y += unit * 4;
    flip *= -1;
  }
  ctx.stroke();
  ctx.restore();
}

/** Stacked gold cornice used for both the capital and the base. */
function cornice(ctx: Ctx2D, x: number, y: number, w: number, h: number, flip: boolean): void {
  ctx.save();
  if (flip) {
    ctx.translate(0, y * 2 + h);
    ctx.scale(1, -1);
  }
  const tiers = [
    { inset: 0, height: h * 0.34 },
    { inset: w * 0.07, height: h * 0.3 },
    { inset: w * 0.15, height: h * 0.36 },
  ];
  let top = y;
  for (const tier of tiers) {
    sculpt(
      ctx,
      (c) => {
        c.beginPath();
        c.rect(x + tier.inset, top, w - tier.inset * 2, tier.height);
      },
      {
        fill: goldGradient(ctx, x, top, x + w, top + tier.height),
        gloss: 0.5,
        occlusion: 0.35,
        shadow: false,
        outline: 'rgba(40,26,4,0.8)',
        outlineWidth: 1.2,
      },
    );
    top += tier.height;
  }
  ctx.restore();
}

/**
 * Renders one carved panel at `width` × `height`. Draw it into a canvas sized
 * to the element; it composes top-down so any aspect works.
 */
export function drawPillar(ctx: Ctx2D, width: number, height: number, accent: string): void {
  ctx.clearRect(0, 0, width, height);

  const shaftX = width * 0.12;
  const shaftW = width * 0.76;
  const capH = height * 0.075;
  const baseH = height * 0.085;
  const shaftTop = capH;
  const shaftBottom = height - baseH;
  const shaftH = shaftBottom - shaftTop;

  // Stone shaft with a lit left edge and a shaded right one
  const stone = ctx.createLinearGradient(shaftX, 0, shaftX + shaftW, 0);
  stone.addColorStop(0, '#0A0F1C');
  stone.addColorStop(0.16, '#2A3A5E');
  stone.addColorStop(0.42, '#1B2740');
  stone.addColorStop(0.78, '#101827');
  stone.addColorStop(1, '#060A13');
  ctx.fillStyle = stone;
  ctx.fillRect(shaftX, shaftTop, shaftW, shaftH);

  // Flutes
  for (let i = 1; i <= 3; i += 1) {
    const fx = shaftX + (shaftW / 4) * i;
    const flute = ctx.createLinearGradient(fx - shaftW * 0.06, 0, fx + shaftW * 0.06, 0);
    flute.addColorStop(0, 'rgba(0,0,0,0.45)');
    flute.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    flute.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = flute;
    ctx.fillRect(fx - shaftW * 0.06, shaftTop, shaftW * 0.12, shaftH);
  }

  // Inlaid accent seam down both edges
  [shaftX + shaftW * 0.045, shaftX + shaftW * 0.955].forEach((sx) => {
    const seam = ctx.createLinearGradient(0, shaftTop, 0, shaftBottom);
    seam.addColorStop(0, hexToRgba(accent, 0));
    seam.addColorStop(0.5, hexToRgba(accent, 0.75));
    seam.addColorStop(1, hexToRgba(accent, 0));
    ctx.fillStyle = seam;
    ctx.fillRect(sx - width * 0.006, shaftTop, width * 0.012, shaftH);
  });

  // Meander running the flanks of the shaft
  const unit = Math.max(3, shaftW * 0.075);
  meander(ctx, shaftX + shaftW * 0.17, shaftTop + shaftH * 0.02, shaftBottom - shaftH * 0.02, unit, accent);
  meander(ctx, shaftX + shaftW * 0.83, shaftTop + shaftH * 0.02, shaftBottom - shaftH * 0.02, unit, accent);

  // Rosettes and beaded bands down the shaft
  const medallionR = Math.min(shaftW * 0.34, shaftH * 0.075);
  const slots = 3;
  for (let i = 0; i < slots; i += 1) {
    const cy = shaftTop + shaftH * ((i + 0.5) / slots);
    rosette(ctx, width / 2, cy, medallionR, accent);

    if (i < slots - 1) {
      const bandY = shaftTop + shaftH * ((i + 1) / slots);
      sculpt(
        ctx,
        (c) => {
          c.beginPath();
          c.rect(shaftX - width * 0.04, bandY - height * 0.011, shaftW + width * 0.08, height * 0.022);
        },
        {
          fill: goldGradient(ctx, shaftX, bandY - 10, shaftX + shaftW, bandY + 10),
          gloss: 0.6,
          occlusion: 0.3,
          shadow: false,
          outline: 'rgba(40,26,4,0.8)',
          outlineWidth: 1,
        },
      );
    }
  }

  cornice(ctx, shaftX - width * 0.09, 0, shaftW + width * 0.18, capH, false);
  cornice(ctx, shaftX - width * 0.09, height - baseH, shaftW + width * 0.18, baseH, true);
}
