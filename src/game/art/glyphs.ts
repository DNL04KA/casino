import type { SymbolId, SymbolPalette } from '@/types';
import {
  cutGem,
  embossText,
  goldGradient,
  hexToRgba,
  materialGradient,
  polygonPath,
  sculpt,
  specular,
  starPath,
  type Ctx2D,
  type GemColors,
  type PathFn,
} from './primitives';

/**
 * Every glyph is authored inside a 100 × 100 design box and scaled by the tile
 * renderer, so the same vector art is crisp at any reel size.
 *
 * Symbols are built as *objects*, not icons: a sculpted body carries the light,
 * cut gems provide the colour accents and gold fittings tie the set together.
 */
export type GlyphPainter = (ctx: Ctx2D, palette: SymbolPalette) => void;

const JADE: GemColors = { light: '#C9FFEC', mid: '#1FA97C', dark: '#053C2C', glow: '#28D6A0' };
const AMETHYST: GemColors = { light: '#EADCFF', mid: '#8A4DFF', dark: '#33176E', glow: '#8A4DFF' };
const AQUA: GemColors = { light: '#DFF8FF', mid: '#3FC3EE', dark: '#0A4A6E', glow: '#25D9FF' };
const RUBY: GemColors = { light: '#FFD9E1', mid: '#FF4D6D', dark: '#75122B', glow: '#FF4D6D' };
const EMERALD: GemColors = { light: '#D6FFF0', mid: '#28D6A0', dark: '#075740', glow: '#28D6A0' };
const AMBER: GemColors = { light: '#FFF0C6', mid: '#F8C65B', dark: '#7E5A12', glow: '#F8C65B' };

const gold = (ctx: Ctx2D, x0?: number, y0?: number, x1?: number, y1?: number) =>
  goldGradient(ctx, x0, y0, x1, y1);

/** Sculpts a shape in polished gold with the standard light direction. */
function goldPart(ctx: Ctx2D, path: PathFn, options: { gloss?: number; shadow?: boolean } = {}): void {
  sculpt(ctx, path, {
    fill: gold(ctx),
    gloss: options.gloss ?? 0.5,
    occlusion: 0.4,
    shadow: options.shadow ?? true,
    outline: 'rgba(48,30,4,0.85)',
    outlineWidth: 1.8,
    rim: 'rgba(255,252,235,0.95)',
  });
}

/** Thin engraved line used for surface detail on metal. */
function engrave(ctx: Ctx2D, draw: PathFn, width = 1.6): void {
  ctx.save();
  draw(ctx);
  ctx.lineCap = 'round';
  ctx.lineWidth = width + 1.1;
  ctx.strokeStyle = 'rgba(0,0,0,0.42)';
  ctx.stroke();
  draw(ctx);
  ctx.lineWidth = width;
  ctx.strokeStyle = 'rgba(255,244,214,0.5)';
  ctx.stroke();
  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/*  High pay — Jade Dragon                                                    */
/* -------------------------------------------------------------------------- */

const dragon: GlyphPainter = (ctx) => {
  // Swept horns, behind the skull
  goldPart(ctx, (c) => {
    c.beginPath();
    c.moveTo(70, 26);
    c.bezierCurveTo(80, 12, 92, 5, 99, 2);
    c.bezierCurveTo(94, 15, 86, 27, 76, 34);
    c.closePath();
  });
  goldPart(ctx, (c) => {
    c.beginPath();
    c.moveTo(58, 22);
    c.bezierCurveTo(65, 11, 75, 5, 82, 2);
    c.bezierCurveTo(77, 12, 71, 21, 64, 28);
    c.closePath();
  });

  // Jade mane running down the back of the skull
  [
    [82, 42, 99, 46, 84, 54],
    [82, 54, 99, 62, 80, 66],
    [76, 64, 92, 76, 72, 76],
  ].forEach(([x1, y1, x2, y2, x3, y3]) => {
    sculpt(
      ctx,
      (c) => {
        c.beginPath();
        c.moveTo(x1 as number, y1 as number);
        c.lineTo(x2 as number, y2 as number);
        c.lineTo(x3 as number, y3 as number);
        c.closePath();
      },
      { light: JADE.light, mid: JADE.mid, dark: JADE.dark, gloss: 0.4, shadow: false, outlineWidth: 1.4 },
    );
  });

  // Lower jaw, drawn first so the upper jaw overlaps it
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(9, 54);
      c.bezierCurveTo(26, 63, 45, 68, 60, 65);
      c.bezierCurveTo(69, 64, 71, 74, 61, 77);
      c.bezierCurveTo(39, 79, 18, 68, 9, 54);
      c.closePath();
    },
    { light: JADE.light, mid: '#177E5D', dark: '#042C20', gloss: 0.4, occlusion: 0.5, outlineWidth: 2 },
  );

  // Upper jaw and skull — a long profile facing left
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(5, 45);
      c.bezierCurveTo(15, 31, 33, 21, 52, 19);
      c.bezierCurveTo(70, 17, 84, 27, 88, 45);
      c.bezierCurveTo(90, 56, 80, 62, 67, 59);
      c.lineTo(58, 56);
      c.bezierCurveTo(42, 55, 22, 51, 5, 45);
      c.closePath();
    },
    { light: JADE.light, mid: JADE.mid, dark: JADE.dark, gloss: 0.62, occlusion: 0.48 },
  );

  // Carved plane along the snout
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(10, 42);
    c.bezierCurveTo(26, 32, 44, 27, 60, 27);
  }, 1.4);

  // Fangs on both jaws
  [
    [17, 47],
    [30, 51],
    [43, 54],
  ].forEach(([fx, fy]) => {
    sculpt(
      ctx,
      (c) => {
        c.beginPath();
        c.moveTo(fx as number, (fy as number) - 2);
        c.lineTo((fx as number) + 7, (fy as number) - 0.5);
        c.lineTo((fx as number) + 3, (fy as number) + 9);
        c.closePath();
      },
      { light: '#FFFFFF', mid: '#F1E7CE', dark: '#9A8C6A', gloss: 0.75, shadow: false, outlineWidth: 1 },
    );
  });
  [
    [24, 66],
    [40, 70],
  ].forEach(([fx, fy]) => {
    sculpt(
      ctx,
      (c) => {
        c.beginPath();
        c.moveTo(fx as number, fy as number);
        c.lineTo((fx as number) + 6, (fy as number) + 1);
        c.lineTo((fx as number) + 3, (fy as number) - 8);
        c.closePath();
      },
      { light: '#FFFFFF', mid: '#EFE3C6', dark: '#8F8262', gloss: 0.7, shadow: false, outlineWidth: 1 },
    );
  });

  // Gold brow ridge over the eye
  goldPart(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(45, 33);
      c.bezierCurveTo(54, 25, 68, 25, 76, 32);
      c.lineTo(72, 39);
      c.bezierCurveTo(65, 33, 54, 33, 48, 40);
      c.closePath();
    },
    { shadow: false, gloss: 0.7 },
  );

  // Eye
  cutGem(ctx, 60, 42, 10, 6, -Math.PI / 2, AMBER);
  ctx.beginPath();
  ctx.ellipse(60, 42, 2.2, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,6,2,0.92)';
  ctx.fill();
  specular(ctx, 57, 38.5, 2.8, 1.7, -0.5, 0.9);

  // Nostril + whisker
  ctx.beginPath();
  ctx.ellipse(15, 40, 3, 2, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(3,28,20,0.85)';
  ctx.fill();
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(12, 36);
    c.bezierCurveTo(6, 26, 8, 14, 14, 6);
  }, 1.6);
};

/* -------------------------------------------------------------------------- */
/*  High pay — Warden Mask                                                    */
/* -------------------------------------------------------------------------- */

const mask: GlyphPainter = (ctx) => {
  // Side flanges
  [
    { x: 10, flip: -1 },
    { x: 90, flip: 1 },
  ].forEach(({ x, flip }) => {
    goldPart(ctx, (c) => {
      c.beginPath();
      c.moveTo(x, 30);
      c.bezierCurveTo(x + flip * 10, 34, x + flip * 12, 52, x + flip * 4, 66);
      c.lineTo(x - flip * 8, 58);
      c.bezierCurveTo(x - flip * 4, 46, x - flip * 4, 38, x, 30);
      c.closePath();
    });
  });

  // Mask body
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(50, 4);
      c.bezierCurveTo(72, 4, 84, 20, 84, 42);
      c.bezierCurveTo(84, 68, 68, 94, 50, 97);
      c.bezierCurveTo(32, 94, 16, 68, 16, 42);
      c.bezierCurveTo(16, 20, 28, 4, 50, 4);
      c.closePath();
    },
    {
      fill: gold(ctx, 18, 4, 84, 96),
      gloss: 0.55,
      occlusion: 0.45,
      outline: 'rgba(46,28,4,0.9)',
      outlineWidth: 2.2,
      rim: 'rgba(255,252,235,0.95)',
    },
  );

  // Inner bevel line
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(50, 12);
    c.bezierCurveTo(68, 12, 78, 24, 78, 43);
    c.bezierCurveTo(78, 64, 64, 86, 50, 89);
    c.bezierCurveTo(36, 86, 22, 64, 22, 43);
    c.bezierCurveTo(22, 24, 32, 12, 50, 12);
  }, 1.2);

  // Brow ridge
  goldPart(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(22, 40);
      c.bezierCurveTo(34, 30, 66, 30, 78, 40);
      c.lineTo(74, 47);
      c.bezierCurveTo(64, 39, 36, 39, 26, 47);
      c.closePath();
    },
    { shadow: false, gloss: 0.7 },
  );

  // Eye sockets + gems
  [34, 66].forEach((ex, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, 53, 13, 8.5, i === 0 ? 0.12 : -0.12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6,12,22,0.92)';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(255,244,214,0.4)';
    ctx.stroke();
    ctx.restore();
    cutGem(ctx, ex, 53, 7, 6, i === 0 ? 0.2 : -0.2, AQUA);
  });

  // Nose ridge
  goldPart(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(50, 46);
      c.lineTo(56, 70);
      c.lineTo(50, 74);
      c.lineTo(44, 70);
      c.closePath();
    },
    { shadow: false, gloss: 0.75 },
  );

  // Forehead gem
  cutGem(ctx, 50, 24, 9.5, 6, Math.PI / 6, AMETHYST);

  // Fangs
  [41, 59].forEach((tx, i) => {
    sculpt(
      ctx,
      (c) => {
        c.beginPath();
        c.moveTo(tx, 76);
        c.lineTo(tx + (i === 0 ? -5 : 5), 78);
        c.lineTo(tx + (i === 0 ? -1 : 1), 90);
        c.closePath();
      },
      { light: '#FFFFFF', mid: '#EFE6D2', dark: '#9C8F6E', gloss: 0.7, shadow: false, outlineWidth: 1 },
    );
  });

  // Cheek engraving
  [30, 70].forEach((cx2) => {
    engrave(ctx, (c) => {
      c.beginPath();
      c.moveTo(cx2, 64);
      c.bezierCurveTo(cx2 + (cx2 < 50 ? 3 : -3), 72, cx2 + (cx2 < 50 ? 7 : -7), 76, cx2 + (cx2 < 50 ? 8 : -8), 80);
    }, 1.4);
  });
};

/* -------------------------------------------------------------------------- */
/*  High pay — Night Empress                                                  */
/* -------------------------------------------------------------------------- */

const empress: GlyphPainter = (ctx) => {
  // Shoulders and robe fill the lower third
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(4, 100);
      c.bezierCurveTo(8, 82, 24, 71, 50, 71);
      c.bezierCurveTo(76, 71, 92, 82, 96, 100);
      c.closePath();
    },
    { light: '#B79CF5', mid: '#5B3AA8', dark: '#190D36', gloss: 0.42, occlusion: 0.5 },
  );
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(30, 80);
    c.lineTo(25, 99);
    c.moveTo(70, 80);
    c.lineTo(75, 99);
  }, 1.3);

  // Hair falling either side of the face
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(20, 44);
      c.bezierCurveTo(16, 12, 84, 12, 80, 44);
      c.bezierCurveTo(87, 66, 78, 84, 69, 86);
      c.bezierCurveTo(76, 62, 70, 43, 50, 43);
      c.bezierCurveTo(30, 43, 24, 62, 31, 86);
      c.bezierCurveTo(22, 84, 13, 66, 20, 44);
      c.closePath();
    },
    { light: '#9A7BE6', mid: '#3A1C78', dark: '#100722', gloss: 0.45, shadow: false },
  );

  // Face
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.ellipse(50, 45, 24, 28, 0, 0, Math.PI * 2);
    },
    { light: '#FFFFFF', mid: '#DCCDF8', dark: '#6E56AA', gloss: 0.66, occlusion: 0.42, outlineWidth: 1.8 },
  );

  // Eyes
  [41, 59].forEach((ex) => {
    ctx.beginPath();
    ctx.ellipse(ex, 46, 6.2, 3.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12,8,28,0.9)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + 1, 45.2, 2.1, 0, Math.PI * 2);
    ctx.fillStyle = '#25D9FF';
    ctx.fill();
    specular(ctx, ex - 1.6, 44.2, 1.6, 1.1, 0, 0.9);
  });

  // Brows and lips
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(33, 38);
    c.quadraticCurveTo(40, 34, 47, 38);
    c.moveTo(53, 38);
    c.quadraticCurveTo(60, 34, 67, 38);
  }, 1.2);
  ctx.beginPath();
  ctx.moveTo(43, 60);
  ctx.quadraticCurveTo(50, 66, 57, 60);
  ctx.quadraticCurveTo(50, 63, 43, 60);
  ctx.fillStyle = hexToRgba('#FF4D6D', 0.9);
  ctx.fill();

  // Tiara — a banded crown with three peaks
  goldPart(ctx, (c) => {
    c.beginPath();
    c.moveTo(19, 28);
    c.bezierCurveTo(22, 12, 34, 8, 38, 22);
    c.bezierCurveTo(42, 2, 58, 2, 62, 22);
    c.bezierCurveTo(66, 8, 78, 12, 81, 28);
    c.bezierCurveTo(66, 19, 34, 19, 19, 28);
    c.closePath();
  });
  goldPart(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(17, 27);
      c.bezierCurveTo(32, 17, 68, 17, 83, 27);
      c.lineTo(80, 37);
      c.bezierCurveTo(66, 28, 34, 28, 20, 37);
      c.closePath();
    },
    { shadow: false, gloss: 0.72 },
  );

  // Crown stones
  cutGem(ctx, 50, 24, 8.5, 6, Math.PI / 6, AMETHYST);
  cutGem(ctx, 30, 27, 5, 6, 0, AQUA);
  cutGem(ctx, 70, 27, 5, 6, 0, AQUA);

  // Collar
  goldPart(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(31, 78);
      c.bezierCurveTo(40, 86, 60, 86, 69, 78);
      c.lineTo(73, 85);
      c.bezierCurveTo(62, 95, 38, 95, 27, 85);
      c.closePath();
    },
    { shadow: false, gloss: 0.6 },
  );
  [41, 50, 59].forEach((nx, i) => {
    cutGem(ctx, nx, i === 1 ? 89 : 85, i === 1 ? 5.8 : 4.4, 6, 0, i === 1 ? AMETHYST : AMBER);
  });
};

/* -------------------------------------------------------------------------- */
/*  High pay — Golden Tiger                                                   */
/* -------------------------------------------------------------------------- */

const tiger: GlyphPainter = (ctx) => {
  // Scalloped gold ruff behind the head — turns the face into a temple idol
  goldPart(ctx, (c) => {
    c.beginPath();
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 47 : 39;
      const x = 50 + Math.cos(a) * r;
      const y = 52 + Math.sin(a) * r;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
  });

  // Ears
  [
    { x: 25, flip: -1 },
    { x: 75, flip: 1 },
  ].forEach(({ x, flip }) => {
    goldPart(ctx, (c) => {
      c.beginPath();
      c.moveTo(x - flip * 4, 32);
      c.bezierCurveTo(x + flip * 2, 8, x + flip * 16, 6, x + flip * 22, 16);
      c.bezierCurveTo(x + flip * 18, 26, x + flip * 10, 32, x + flip * 4, 36);
      c.closePath();
    });
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + flip * 1, 30);
    ctx.bezierCurveTo(x + flip * 5, 15, x + flip * 13, 13, x + flip * 17, 18);
    ctx.bezierCurveTo(x + flip * 13, 24, x + flip * 8, 28, x + flip * 4, 31);
    ctx.closePath();
    ctx.fillStyle = 'rgba(44,22,4,0.62)';
    ctx.fill();
    ctx.restore();
  });

  // Head
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(50, 14);
      c.bezierCurveTo(80, 14, 92, 34, 90, 56);
      c.bezierCurveTo(88, 80, 72, 96, 50, 98);
      c.bezierCurveTo(28, 96, 12, 80, 10, 56);
      c.bezierCurveTo(8, 34, 20, 14, 50, 14);
      c.closePath();
    },
    {
      fill: gold(ctx, 12, 12, 90, 98),
      gloss: 0.5,
      occlusion: 0.45,
      outline: 'rgba(46,28,4,0.9)',
      outlineWidth: 2.2,
    },
  );

  // Forehead stripes — short, thick, symmetrical
  const stripes: [number, number, number, number, number][] = [
    [38, 22, 34, 34, 6],
    [50, 20, 50, 32, 6.5],
    [62, 22, 66, 34, 6],
    [18, 46, 32, 44, 5.5],
    [16, 60, 30, 58, 5],
    [82, 46, 68, 44, 5.5],
    [84, 60, 70, 58, 5],
  ];
  stripes.forEach(([x1, y1, x2, y2, w]) => {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = w;
    ctx.strokeStyle = 'rgba(30,15,2,0.88)';
    ctx.stroke();
    ctx.lineWidth = w * 0.35;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.stroke();
    ctx.restore();
  });

  // Brow ridge
  goldPart(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(22, 46);
      c.bezierCurveTo(34, 37, 66, 37, 78, 46);
      c.lineTo(74, 53);
      c.bezierCurveTo(63, 45, 37, 45, 26, 53);
      c.closePath();
    },
    { shadow: false, gloss: 0.72 },
  );

  // Eyes
  [35, 65].forEach((ex, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, 57, 12.5, 8, i === 0 ? 0.18 : -0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,6,2,0.92)';
    ctx.fill();
    ctx.restore();
    cutGem(ctx, ex, 57, 7.5, 6, 0, EMERALD);
    ctx.beginPath();
    ctx.ellipse(ex, 57, 1.9, 5.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6,4,0,0.92)';
    ctx.fill();
    specular(ctx, ex - 2.6, 53.6, 2.4, 1.5, -0.5, 0.9);
  });

  // Muzzle
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.ellipse(50, 78, 22, 15, 0, 0, Math.PI * 2);
    },
    { light: '#FFFFFF', mid: '#F3E6C6', dark: '#A08B57', gloss: 0.6, shadow: false, outlineWidth: 1.5 },
  );
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(42, 69);
      c.lineTo(58, 69);
      c.lineTo(50, 79);
      c.closePath();
    },
    { light: '#7A5430', mid: '#2E1A08', dark: '#0E0702', gloss: 0.55, shadow: false, outlineWidth: 1 },
  );
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(50, 79);
    c.lineTo(50, 85);
    c.moveTo(50, 85);
    c.quadraticCurveTo(41, 91, 36, 83);
    c.moveTo(50, 85);
    c.quadraticCurveTo(59, 91, 64, 83);
  }, 2);

  // Whiskers
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(30, 76);
    c.bezierCurveTo(20, 74, 12, 72, 6, 68);
    c.moveTo(70, 76);
    c.bezierCurveTo(80, 74, 88, 72, 94, 68);
  }, 1.2);
};

/* -------------------------------------------------------------------------- */
/*  Celestial Wild                                                            */
/* -------------------------------------------------------------------------- */

const wild: GlyphPainter = (ctx) => {
  // Radiating spikes
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    const long = i % 2 === 0;
    const r0 = 27;
    const r1 = long ? 44 : 36;
    const w = long ? 0.09 : 0.05;
    goldPart(
      ctx,
      (c) => {
        c.beginPath();
        c.moveTo(50 + Math.cos(a - w) * r0, 42 + Math.sin(a - w) * r0);
        c.lineTo(50 + Math.cos(a) * r1, 42 + Math.sin(a) * r1);
        c.lineTo(50 + Math.cos(a + w) * r0, 42 + Math.sin(a + w) * r0);
        c.closePath();
      },
      { shadow: false, gloss: 0.6 },
    );
  }

  // Amulet ring
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.arc(50, 42, 29, 0, Math.PI * 2);
      c.arc(50, 42, 17, 0, Math.PI * 2, true);
    },
    {
      fill: gold(ctx, 22, 14, 78, 70),
      gloss: 0.65,
      occlusion: 0.5,
      outline: 'rgba(46,28,4,0.9)',
      outlineWidth: 1.8,
    },
  );

  // Studs around the ring
  for (let i = 0; i < 8; i += 1) {
    const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(50 + Math.cos(a) * 23, 42 + Math.sin(a) * 23, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60,38,6,0.55)';
    ctx.fill();
    specular(ctx, 50 + Math.cos(a) * 23 - 0.7, 42 + Math.sin(a) * 23 - 0.8, 1.6, 1.2, 0, 0.8);
  }

  // Centre stone
  cutGem(ctx, 50, 42, 17, 8, Math.PI / 8, AMETHYST);

  // Sparkle
  starPath(ctx, 66, 24, 9, 2.2, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();

  // Wordmark ribbon
  goldPart(ctx, (c) => {
    c.beginPath();
    c.moveTo(18, 76);
    c.lineTo(82, 76);
    c.lineTo(75, 95);
    c.lineTo(25, 95);
    c.closePath();
  });
  ctx.save();
  ctx.font = '700 15px "Cinzel Decorative", Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,250,232,0.5)';
  ctx.fillText('WILD', 50, 86.6);
  ctx.fillStyle = 'rgba(48,28,2,0.92)';
  ctx.fillText('WILD', 50, 85.6);
  ctx.restore();
};

/* -------------------------------------------------------------------------- */
/*  Temple Gate (scatter)                                                     */
/* -------------------------------------------------------------------------- */

const scatter: GlyphPainter = (ctx) => {
  // Portal
  const portal = ctx.createRadialGradient(50, 54, 2, 50, 54, 32);
  portal.addColorStop(0, '#FFFFFF');
  portal.addColorStop(0.2, '#8FF0FF');
  portal.addColorStop(0.48, '#25D9FF');
  portal.addColorStop(0.78, '#6A3BD8');
  portal.addColorStop(1, 'rgba(12,6,40,0.15)');
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(50, 56, 25, 32, 0, 0, Math.PI * 2);
  ctx.fillStyle = portal;
  ctx.fill();
  ctx.clip();
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(50, 56, 6 + i * 6, 10 + i * 7, i * 0.6, 0.3, Math.PI * 1.75);
    ctx.lineWidth = 2 - i * 0.3;
    ctx.strokeStyle = `rgba(255,255,255,${0.5 - i * 0.1})`;
    ctx.stroke();
  }
  ctx.restore();
  specular(ctx, 41, 40, 7, 4, -0.6, 0.8);

  // Pillars
  [
    [10, 22],
    [72, 22],
  ].forEach(([px, pw]) => {
    sculpt(
      ctx,
      (c) => {
        c.beginPath();
        c.moveTo(px + 2, 30);
        c.lineTo(px + pw - 2, 30);
        c.lineTo(px + pw, 92);
        c.lineTo(px, 92);
        c.closePath();
      },
      { light: '#8FA9D6', mid: '#33456B', dark: '#0D1526', gloss: 0.45, occlusion: 0.5 },
    );
    engrave(ctx, (c) => {
      c.beginPath();
      c.moveTo(px + pw / 2, 42);
      c.lineTo(px + pw / 2, 84);
      c.moveTo(px + 5, 52);
      c.lineTo(px + pw - 5, 52);
      c.moveTo(px + 5, 68);
      c.lineTo(px + pw - 5, 68);
    }, 1.4);
  });

  // Upper beam
  goldPart(ctx, (c) => {
    c.beginPath();
    c.moveTo(2, 22);
    c.quadraticCurveTo(50, 4, 98, 22);
    c.lineTo(98, 32);
    c.quadraticCurveTo(50, 14, 2, 32);
    c.closePath();
  });
  goldPart(ctx, (c) => {
    c.beginPath();
    c.moveTo(8, 34);
    c.lineTo(92, 34);
    c.lineTo(90, 44);
    c.lineTo(10, 44);
    c.closePath();
  });

  // Steps
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(4, 92);
      c.lineTo(96, 92);
      c.lineTo(100, 100);
      c.lineTo(0, 100);
      c.closePath();
    },
    { light: '#8FA9D6', mid: '#33456B', dark: '#0D1526', gloss: 0.35, shadow: false },
  );
};

/* -------------------------------------------------------------------------- */
/*  Mystery Rune                                                              */
/* -------------------------------------------------------------------------- */

const mystery: GlyphPainter = (ctx) => {
  ctx.save();
  ctx.translate(50, 50);
  ctx.scale(0.88, 1.16);
  ctx.translate(-50, -50);
  cutGem(ctx, 50, 50, 44, 4, -Math.PI / 2, AMETHYST);
  ctx.restore();

  // Gold rune pressed into the table
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const rune = (c: Ctx2D) => {
    c.beginPath();
    c.moveTo(50, 26);
    c.lineTo(50, 76);
    c.moveTo(50, 40);
    c.lineTo(36, 29);
    c.moveTo(50, 53);
    c.lineTo(65, 40);
    c.moveTo(50, 66);
    c.lineTo(36, 57);
  };
  rune(ctx);
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(20,8,48,0.75)';
  ctx.stroke();
  rune(ctx);
  ctx.lineWidth = 4.4;
  ctx.strokeStyle = gold(ctx, 34, 26, 66, 76);
  ctx.stroke();
  rune(ctx);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255,250,232,0.7)';
  ctx.stroke();
  ctx.restore();

  [
    [30, 32, 5],
    [72, 66, 4],
    [70, 28, 3],
  ].forEach(([sx, sy, sr]) => {
    starPath(ctx, sx as number, sy as number, sr as number, (sr as number) * 0.3, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
  });
};

/* -------------------------------------------------------------------------- */
/*  Royals — cut stones with an embossed rank                                 */
/* -------------------------------------------------------------------------- */

interface RoyalSpec {
  letter: string;
  sides: number;
  rotation: number;
  radius: number;
  colors: GemColors;
  /** Silver reads better than gold on the amber stone. */
  silverLetter?: boolean;
}

function royal(spec: RoyalSpec): GlyphPainter {
  return (ctx) => {
    // Gold setting behind the stone
    sculpt(
      ctx,
      (c) => polygonPath(c, 50, 50, spec.radius + 5, spec.sides, spec.rotation),
      {
        fill: gold(ctx, 12, 6, 88, 94),
        gloss: 0.55,
        occlusion: 0.4,
        outline: 'rgba(46,28,4,0.9)',
        outlineWidth: 2,
      },
    );

    // Claw prongs
    for (let i = 0; i < spec.sides; i += 1) {
      const a = spec.rotation + (i / spec.sides) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(50 + Math.cos(a) * (spec.radius + 3), 50 + Math.sin(a) * (spec.radius + 3), 3.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(60,38,6,0.5)';
      ctx.fill();
      specular(
        ctx,
        50 + Math.cos(a) * (spec.radius + 3) - 1,
        50 + Math.sin(a) * (spec.radius + 3) - 1.2,
        2.2,
        1.6,
        0,
        0.85,
      );
    }

    cutGem(ctx, 50, 50, spec.radius, spec.sides, spec.rotation, spec.colors);

    const size = spec.letter.length > 1 ? 34 : 46;
    const letterFill = spec.silverLetter
      ? materialGradient(ctx, '#FFFFFF', '#DCE6F5', '#6E7E9C', 34, 30, 66, 70)
      : gold(ctx, 34, 28, 66, 72);
    embossText(ctx, spec.letter, 50, 52, size, letterFill);
  };
}

export const GLYPHS: Record<SymbolId, GlyphPainter> = {
  dragon,
  mask,
  empress,
  tiger,
  wild,
  scatter,
  mystery,
  ace: royal({ letter: 'A', sides: 6, rotation: -Math.PI / 2, radius: 38, colors: AQUA }),
  king: royal({ letter: 'K', sides: 5, rotation: -Math.PI / 2, radius: 40, colors: AMETHYST }),
  queen: royal({ letter: 'Q', sides: 8, rotation: Math.PI / 8, radius: 38, colors: EMERALD }),
  jack: royal({ letter: 'J', sides: 4, rotation: -Math.PI / 2, radius: 42, colors: RUBY }),
  ten: royal({ letter: '10', sides: 7, rotation: -Math.PI / 2, radius: 38, colors: AMBER, silverLetter: true }),
};
