import type { SymbolId, SymbolPalette } from '@/types';
import {
  cutGem,
  goldGradient,
  hexToRgba,
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
 * Objects are built as lit solids rather than flat icons: a sculpted body
 * carries the light, gems provide colour accents, and lacquer and gold tie the
 * service together.
 */
export type GlyphPainter = (ctx: Ctx2D, palette: SymbolPalette) => void;

const AMBER: GemColors = { light: '#FFF0C6', mid: '#F8C65B', dark: '#7E5A12', glow: '#F8C65B' };
const FOXFIRE: GemColors = { light: '#D8FFF4', mid: '#6BE3C0', dark: '#085744', glow: '#6BE3C0' };
const AMETHYST: GemColors = { light: '#EADCFF', mid: '#8A4DFF', dark: '#33176E', glow: '#8A4DFF' };
const EMBER: GemColors = { light: '#FFD9E1', mid: '#FF4D6D', dark: '#75122B', glow: '#FF4D6D' };

const gold = (ctx: Ctx2D, x0?: number, y0?: number, x1?: number, y1?: number) =>
  goldGradient(ctx, x0, y0, x1, y1);

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

/** Red lacquer — the house's own finish, used across the service pieces. */
function lacquer(ctx: Ctx2D, path: PathFn, light: string, mid: string, dark: string): void {
  sculpt(ctx, path, {
    light,
    mid,
    dark,
    gloss: 0.66,
    occlusion: 0.5,
    outline: 'rgba(6,4,10,0.85)',
    outlineWidth: 2,
  });
}

function engrave(ctx: Ctx2D, draw: PathFn, width = 1.6, tint = 'rgba(255,244,214,0.5)'): void {
  ctx.save();
  draw(ctx);
  ctx.lineCap = 'round';
  ctx.lineWidth = width + 1.1;
  ctx.strokeStyle = 'rgba(0,0,0,0.42)';
  ctx.stroke();
  draw(ctx);
  ctx.lineWidth = width;
  ctx.strokeStyle = tint;
  ctx.stroke();
  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/*  High — the guests                                                         */
/* -------------------------------------------------------------------------- */

/** Karakasa: one eye, one leg, one very long grudge. */
const kasa: GlyphPainter = (ctx) => {
  // Canopy
  lacquer(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(6, 54);
      c.bezierCurveTo(10, 22, 34, 8, 50, 8);
      c.bezierCurveTo(66, 8, 90, 22, 94, 54);
      c.bezierCurveTo(80, 46, 68, 60, 50, 52);
      c.bezierCurveTo(32, 60, 20, 46, 6, 54);
      c.closePath();
    },
    '#FF9A9A',
    '#D6314B',
    '#5C0A1C',
  );

  // Ribs
  [22, 36, 50, 64, 78].forEach((x) => {
    engrave(ctx, (c) => {
      c.beginPath();
      c.moveTo(50, 10);
      c.quadraticCurveTo((50 + x) / 2, 30, x, 52 + Math.abs(50 - x) * 0.05);
    }, 1.3, 'rgba(255,220,220,0.45)');
  });

  // Finial
  goldPart(ctx, (c) => {
    c.beginPath();
    c.moveTo(47, 12);
    c.lineTo(53, 12);
    c.lineTo(51, 1);
    c.lineTo(49, 1);
    c.closePath();
  }, { shadow: false });

  // Shaft and the single leg with its geta sandal
  lacquer(
    ctx,
    (c) => {
      c.beginPath();
      c.rect(45, 52, 10, 30);
    },
    '#E8C79A',
    '#9A6B3A',
    '#3E2510',
  );
  lacquer(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(38, 82);
      c.lineTo(62, 82);
      c.lineTo(64, 92);
      c.lineTo(36, 92);
      c.closePath();
    },
    '#E8C79A',
    '#8A5C2E',
    '#33200C',
  );
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(42, 92);
    c.lineTo(42, 99);
    c.moveTo(58, 92);
    c.lineTo(58, 99);
  }, 2.4, 'rgba(60,38,16,0.9)');

  // The eye
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.ellipse(50, 36, 16, 12, 0, 0, Math.PI * 2);
    },
    { light: '#FFFFFF', mid: '#F2E6D2', dark: '#8E7B5C', gloss: 0.7, shadow: false, outlineWidth: 1.6 },
  );
  ctx.beginPath();
  ctx.ellipse(50, 36, 7.5, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#120A04';
  ctx.fill();
  specular(ctx, 46, 32, 3.4, 2.2, -0.5, 0.95);

  // Lolling tongue
  lacquer(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(44, 56);
      c.quadraticCurveTo(50, 78, 58, 68);
      c.quadraticCurveTo(56, 60, 56, 56);
      c.closePath();
    },
    '#FFB3C4',
    '#E24C6E',
    '#7A1330',
  );
};

/** Kitsune: a fox mask with the tails behind it. */
const kitsune: GlyphPainter = (ctx) => {
  // Tails
  [
    [16, 92, 2, 62, 30, 70],
    [50, 96, 50, 62, 68, 78],
    [84, 92, 98, 62, 70, 70],
  ].forEach(([x1, y1, x2, y2, x3, y3]) => {
    sculpt(
      ctx,
      (c) => {
        c.beginPath();
        c.moveTo(x1 as number, y1 as number);
        c.quadraticCurveTo(x2 as number, y2 as number, x3 as number, y3 as number);
        c.quadraticCurveTo((x3 as number) - 6, (y3 as number) + 16, x1 as number, y1 as number);
        c.closePath();
      },
      { light: '#FFFFFF', mid: '#F0E2CE', dark: '#8A6E4C', gloss: 0.5, shadow: false, outlineWidth: 1.4 },
    );
  });

  // Mask
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(26, 34);
      c.lineTo(32, 6);
      c.lineTo(48, 20);
      c.lineTo(62, 20);
      c.lineTo(76, 6);
      c.lineTo(82, 34);
      c.bezierCurveTo(88, 60, 72, 84, 54, 84);
      c.bezierCurveTo(36, 84, 20, 60, 26, 34);
      c.closePath();
    },
    { light: '#FFFFFF', mid: '#F5EAD8', dark: '#94815F', gloss: 0.62, occlusion: 0.42, outlineWidth: 2 },
  );

  // Red markings
  [
    [32, 12, 44, 24],
    [76, 12, 64, 24],
  ].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(214,49,75,0.9)';
    ctx.stroke();
  });
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(30, 62);
    c.quadraticCurveTo(40, 70, 48, 66);
    c.moveTo(78, 62);
    c.quadraticCurveTo(68, 70, 60, 66);
  }, 2.6, 'rgba(214,49,75,0.85)');

  // Eyes and snout
  [40, 68].forEach((ex, i) => {
    ctx.beginPath();
    ctx.moveTo(ex - 9, 44);
    ctx.quadraticCurveTo(ex, 36, ex + 9, 44);
    ctx.quadraticCurveTo(ex, 50, ex - 9, 44);
    ctx.closePath();
    ctx.fillStyle = '#120A04';
    ctx.fill();
    cutGem(ctx, ex + (i === 0 ? 1 : -1), 43, 4, 6, 0, FOXFIRE);
  });
  ctx.beginPath();
  ctx.ellipse(54, 70, 5, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1A0E06';
  ctx.fill();
};

/** The Okami: the mistress of the house. */
const okami: GlyphPainter = (ctx) => {
  // Kimono shoulders
  lacquer(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(6, 100);
      c.bezierCurveTo(12, 80, 28, 70, 50, 70);
      c.bezierCurveTo(72, 70, 88, 80, 94, 100);
      c.closePath();
    },
    '#B79CF5',
    '#4B2C8E',
    '#150A30',
  );
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(50, 72);
    c.lineTo(38, 100);
    c.moveTo(50, 72);
    c.lineTo(62, 100);
  }, 2.2, 'rgba(255,240,255,0.5)');

  // Hair
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(22, 46);
      c.bezierCurveTo(18, 14, 82, 14, 78, 46);
      c.bezierCurveTo(84, 66, 74, 80, 66, 82);
      c.bezierCurveTo(74, 58, 68, 44, 50, 44);
      c.bezierCurveTo(32, 44, 26, 58, 34, 82);
      c.bezierCurveTo(26, 80, 16, 66, 22, 46);
      c.closePath();
    },
    { light: '#6B5A8C', mid: '#1E1330', dark: '#080410', gloss: 0.5, shadow: false },
  );

  // Face
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.ellipse(50, 48, 21, 25, 0, 0, Math.PI * 2);
    },
    { light: '#FFFFFF', mid: '#F3E4EC', dark: '#A98CA0', gloss: 0.6, occlusion: 0.4, outlineWidth: 1.6 },
  );

  [41, 59].forEach((ex) => {
    ctx.beginPath();
    ctx.moveTo(ex - 6, 50);
    ctx.quadraticCurveTo(ex, 45, ex + 6, 50);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1A0F22';
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(46, 62);
  ctx.quadraticCurveTo(50, 66, 54, 62);
  ctx.quadraticCurveTo(50, 64, 46, 62);
  ctx.fillStyle = hexToRgba('#FF4D6D', 0.92);
  ctx.fill();

  // Kanzashi hairpins
  goldPart(ctx, (c) => {
    c.beginPath();
    c.moveTo(70, 30);
    c.lineTo(94, 14);
    c.lineTo(96, 19);
    c.lineTo(73, 35);
    c.closePath();
  }, { shadow: false });
  cutGem(ctx, 92, 15, 6, 6, 0, EMBER);
  cutGem(ctx, 50, 22, 7, 6, Math.PI / 6, AMETHYST);
};

/** Tanuki: belly, leaf, and an empty purse. */
const tanuki: GlyphPainter = (ctx) => {
  // Ears
  [
    [26, 26],
    [74, 26],
  ].forEach(([ex, ey]) => {
    sculpt(
      ctx,
      (c) => {
        c.beginPath();
        c.ellipse(ex as number, ey as number, 12, 13, 0, 0, Math.PI * 2);
      },
      { light: '#C8A783', mid: '#6B4A2C', dark: '#2A170A', gloss: 0.45, shadow: false, outlineWidth: 1.6 },
    );
  });

  // Head and body
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(50, 16);
      c.bezierCurveTo(78, 16, 90, 38, 88, 58);
      c.bezierCurveTo(86, 84, 70, 98, 50, 98);
      c.bezierCurveTo(30, 98, 14, 84, 12, 58);
      c.bezierCurveTo(10, 38, 22, 16, 50, 16);
      c.closePath();
    },
    { light: '#D6B48D', mid: '#7A5330', dark: '#2C1808', gloss: 0.5, occlusion: 0.45, outlineWidth: 2.2 },
  );

  // Pale belly
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.ellipse(50, 72, 24, 20, 0, 0, Math.PI * 2);
    },
    { light: '#FFFFFF', mid: '#F0E2CA', dark: '#A08B62', gloss: 0.55, shadow: false, outlineWidth: 1.2 },
  );

  // Bandit mask patches
  [36, 64].forEach((ex, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, 48, 14, 10, i === 0 ? 0.2 : -0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(32,18,6,0.85)';
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(ex, 47, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF6E2';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + (i === 0 ? 1 : -1), 47, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = '#100802';
    ctx.fill();
  });

  // Snout
  ctx.beginPath();
  ctx.ellipse(50, 60, 6, 4.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1A0E04';
  ctx.fill();
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(50, 64);
    c.quadraticCurveTo(43, 70, 39, 64);
    c.moveTo(50, 64);
    c.quadraticCurveTo(57, 70, 61, 64);
  }, 1.8, 'rgba(40,22,8,0.9)');

  // Leaf on the head
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(50, 14);
      c.bezierCurveTo(40, 4, 44, -4, 52, -6);
      c.bezierCurveTo(58, 2, 56, 10, 50, 14);
      c.closePath();
    },
    { light: '#D8FFE8', mid: '#3FA85E', dark: '#0E3A1C', gloss: 0.5, shadow: false, outlineWidth: 1.2 },
  );
};

/* -------------------------------------------------------------------------- */
/*  Low — the service                                                         */
/* -------------------------------------------------------------------------- */

const teapot: GlyphPainter = (ctx) => {
  // Spout, drawn first so the body overlaps its root
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(26, 50);
      c.bezierCurveTo(10, 44, 2, 52, 4, 64);
      c.lineTo(14, 64);
      c.bezierCurveTo(13, 56, 18, 54, 28, 60);
      c.closePath();
    },
    { light: '#CFE0F7', mid: '#42587E', dark: '#111A2E', gloss: 0.6, shadow: false, outlineWidth: 1.6 },
  );

  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.ellipse(54, 62, 32, 26, 0, 0, Math.PI * 2);
    },
    { light: '#D6E6FC', mid: '#4A6288'.slice(0, 7), dark: '#101A30', gloss: 0.66, occlusion: 0.45, outlineWidth: 2.2 },
  );
  engrave(ctx, (c) => {
    c.beginPath();
    c.ellipse(54, 64, 22, 17, 0, Math.PI * 0.12, Math.PI * 0.88);
  }, 1.4, 'rgba(200,225,255,0.45)');

  // Lid and knob
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.ellipse(54, 38, 21, 8, 0, 0, Math.PI * 2);
    },
    { light: '#C9DCF5', mid: '#35486B', dark: '#0C1428', gloss: 0.7, shadow: false, outlineWidth: 1.6 },
  );
  goldPart(ctx, (c) => {
    c.beginPath();
    c.arc(54, 31, 7, 0, Math.PI * 2);
  }, { shadow: false });

  // Handle
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(40, 32);
    c.bezierCurveTo(54, 14, 76, 18, 80, 38);
  }, 5.5, 'rgba(214,158,52,0.95)');

  specular(ctx, 42, 50, 9, 5.5, -0.6, 0.78);
};

const cup: GlyphPainter = (ctx) => {
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(20, 40);
      c.bezierCurveTo(24, 76, 34, 86, 50, 86);
      c.bezierCurveTo(66, 86, 76, 76, 80, 40);
      c.closePath();
    },
    { light: '#DCFFF4', mid: '#2C7D68', dark: '#062A21', gloss: 0.62, occlusion: 0.45, outlineWidth: 2.2 },
  );

  // Tea surface
  ctx.beginPath();
  ctx.ellipse(50, 41, 30, 9, 0, 0, Math.PI * 2);
  const tea = ctx.createLinearGradient(24, 34, 76, 50);
  tea.addColorStop(0, '#F3D98C');
  tea.addColorStop(0.5, '#C09A3C');
  tea.addColorStop(1, '#6E4E13');
  ctx.fillStyle = tea;
  ctx.fill();
  specular(ctx, 38, 39, 7, 3, -0.4, 0.8);

  // Foot
  goldPart(ctx, (c) => {
    c.beginPath();
    c.ellipse(50, 90, 16, 5, 0, 0, Math.PI * 2);
  }, { shadow: false });

  // Rising steam
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(40, 30);
    c.bezierCurveTo(34, 20, 46, 14, 40, 4);
    c.moveTo(60, 30);
    c.bezierCurveTo(66, 20, 54, 14, 60, 4);
  }, 2, 'rgba(255,255,255,0.45)');
};

const lantern: GlyphPainter = (ctx) => {
  goldPart(ctx, (c) => {
    c.beginPath();
    c.rect(38, 2, 24, 8);
  }, { shadow: false });

  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(30, 14);
      c.bezierCurveTo(8, 30, 8, 68, 30, 84);
      c.lineTo(70, 84);
      c.bezierCurveTo(92, 68, 92, 30, 70, 14);
      c.closePath();
    },
    { light: '#FFE7C0', mid: '#E2703C', dark: '#6E2410', gloss: 0.55, occlusion: 0.4, outlineWidth: 2.2 },
  );

  // Bamboo ribs
  [26, 38, 50, 62, 74].forEach((y) => {
    engrave(ctx, (c) => {
      c.beginPath();
      c.moveTo(12 + Math.abs(50 - y) * 0.16, y);
      c.lineTo(88 - Math.abs(50 - y) * 0.16, y);
    }, 1.4, 'rgba(120,44,16,0.6)');
  });

  // Painted seal
  ctx.save();
  ctx.beginPath();
  ctx.rect(40, 40, 20, 22);
  ctx.fillStyle = 'rgba(180,26,44,0.85)';
  ctx.fill();
  ctx.restore();
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(44, 47);
    c.lineTo(56, 47);
    c.moveTo(50, 47);
    c.lineTo(50, 57);
    c.moveTo(44, 57);
    c.lineTo(56, 57);
  }, 1.8, 'rgba(255,240,220,0.85)');

  goldPart(ctx, (c) => {
    c.beginPath();
    c.rect(36, 84, 28, 9);
  }, { shadow: false });
};

const fan: GlyphPainter = (ctx) => {
  const blades = 9;
  for (let i = 0; i < blades; i += 1) {
    const a = Math.PI * (0.08 + (i / (blades - 1)) * 0.84);
    const inner = 12;
    const outer = 74;
    sculpt(
      ctx,
      (c) => {
        c.beginPath();
        c.moveTo(50 - Math.cos(a) * inner, 88 - Math.sin(a) * inner);
        c.lineTo(50 - Math.cos(a - 0.05) * outer, 88 - Math.sin(a - 0.05) * outer);
        c.lineTo(50 - Math.cos(a + 0.05) * outer, 88 - Math.sin(a + 0.05) * outer);
        c.closePath();
      },
      {
        light: i % 2 === 0 ? '#FFFFFF' : '#FFD6DE',
        mid: i % 2 === 0 ? '#E6E0D2' : '#D6314B',
        dark: i % 2 === 0 ? '#8C846E' : '#5C0A1C',
        gloss: 0.5,
        shadow: false,
        outlineWidth: 1.2,
      },
    );
  }

  // Rivet
  goldPart(ctx, (c) => {
    c.beginPath();
    c.arc(50, 88, 8, 0, Math.PI * 2);
  }, { shadow: false });
  specular(ctx, 47, 85, 3, 2, -0.5, 0.9);
};

const incense: GlyphPainter = (ctx) => {
  // Smoke first, so the bowl overlaps it
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(44, 38);
    c.bezierCurveTo(34, 26, 52, 20, 42, 8);
    c.moveTo(58, 38);
    c.bezierCurveTo(68, 26, 50, 20, 60, 6);
  }, 2.4, 'rgba(255,240,210,0.4)');

  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(18, 46);
      c.bezierCurveTo(22, 78, 34, 86, 50, 86);
      c.bezierCurveTo(66, 86, 78, 78, 82, 46);
      c.closePath();
    },
    { light: '#FFE9AE', mid: '#A87A1E', dark: '#3A2708', gloss: 0.6, occlusion: 0.45, outlineWidth: 2.2 },
  );

  goldPart(ctx, (c) => {
    c.beginPath();
    c.ellipse(50, 46, 34, 8, 0, 0, Math.PI * 2);
  }, { shadow: false, gloss: 0.7 });

  // Three legs
  [26, 50, 74].forEach((x) => {
    goldPart(ctx, (c) => {
      c.beginPath();
      c.moveTo(x - 5, 84);
      c.lineTo(x + 5, 84);
      c.lineTo(x + 3, 96);
      c.lineTo(x - 3, 96);
      c.closePath();
    }, { shadow: false });
  });

  cutGem(ctx, 50, 62, 9, 6, Math.PI / 6, AMBER);
};

/* -------------------------------------------------------------------------- */
/*  Special roles                                                             */
/* -------------------------------------------------------------------------- */

/** Wild — a koban coin, still warm. */
const wild: GlyphPainter = (ctx) => {
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    const long = i % 2 === 0;
    goldPart(
      ctx,
      (c) => {
        c.beginPath();
        c.moveTo(50 + Math.cos(a - 0.06) * 30, 46 + Math.sin(a - 0.06) * 24);
        c.lineTo(50 + Math.cos(a) * (long ? 46 : 38), 46 + Math.sin(a) * (long ? 38 : 32));
        c.lineTo(50 + Math.cos(a + 0.06) * 30, 46 + Math.sin(a + 0.06) * 24);
        c.closePath();
      },
      { shadow: false, gloss: 0.6 },
    );
  }

  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.ellipse(50, 46, 30, 24, 0, 0, Math.PI * 2);
    },
    {
      fill: gold(ctx, 22, 22, 78, 70),
      gloss: 0.68,
      occlusion: 0.45,
      outline: 'rgba(46,28,4,0.9)',
      outlineWidth: 2,
    },
  );
  engrave(ctx, (c) => {
    c.beginPath();
    c.ellipse(50, 46, 23, 17, 0, 0, Math.PI * 2);
  }, 1.4, 'rgba(120,80,10,0.7)');

  // Stamped marks
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(40, 40);
    c.lineTo(60, 40);
    c.moveTo(50, 34);
    c.lineTo(50, 56);
    c.moveTo(40, 52);
    c.lineTo(60, 52);
  }, 2.6, 'rgba(110,72,8,0.85)');
  specular(ctx, 38, 36, 9, 5, -0.6, 0.85);

  goldPart(ctx, (c) => {
    c.beginPath();
    c.moveTo(20, 76);
    c.lineTo(80, 76);
    c.lineTo(74, 95);
    c.lineTo(26, 95);
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

/** Scatter — the noren curtain over the door. */
const scatter: GlyphPainter = (ctx) => {
  // Doorway beyond the cloth
  const glow = ctx.createLinearGradient(0, 20, 0, 96);
  glow.addColorStop(0, '#1A1140');
  glow.addColorStop(0.6, '#3A2A78');
  glow.addColorStop(1, '#0A0620');
  ctx.fillStyle = glow;
  ctx.fillRect(16, 20, 68, 76);

  // Rail
  goldPart(ctx, (c) => {
    c.beginPath();
    c.rect(6, 14, 88, 9);
  });

  // Three hanging panels, the middle one lifted
  const panels: [number, number, number][] = [
    [16, 24, 74],
    [39, 24, 62],
    [62, 24, 74],
  ];
  panels.forEach(([x, y, h], i) => {
    lacquer(
      ctx,
      (c) => {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + 22, y);
        c.lineTo(x + 22 - (i === 1 ? 2 : 0), y + h);
        c.quadraticCurveTo(x + 11, y + h + 5, x + (i === 1 ? 2 : 0), y + h);
        c.closePath();
      },
      '#5E7BD6',
      '#22307A',
      '#0A0E2A',
    );
  });

  // Painted mark on the centre panel
  engrave(ctx, (c) => {
    c.beginPath();
    c.moveTo(44, 44);
    c.lineTo(56, 44);
    c.moveTo(50, 38);
    c.lineTo(50, 62);
    c.moveTo(44, 56);
    c.lineTo(56, 56);
  }, 2.6, 'rgba(255,246,222,0.9)');

  // Light spilling under the cloth
  const spill = ctx.createLinearGradient(0, 88, 0, 100);
  spill.addColorStop(0, hexToRgba('#F8A65B', 0));
  spill.addColorStop(1, hexToRgba('#F8A65B', 0.75));
  ctx.fillStyle = spill;
  ctx.fillRect(16, 84, 68, 14);
};

/** Mystery — a sealed ofuda, ink still damp. */
const mystery: GlyphPainter = (ctx) => {
  sculpt(
    ctx,
    (c) => {
      c.beginPath();
      c.moveTo(32, 6);
      c.lineTo(68, 6);
      c.lineTo(72, 84);
      c.lineTo(50, 96);
      c.lineTo(28, 84);
      c.closePath();
    },
    { light: '#FFFFFF', mid: '#EDE2CA', dark: '#9A8A66', gloss: 0.55, occlusion: 0.4, outlineWidth: 2 },
  );

  // Brushed column of characters
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(24,14,32,0.9)';
  ctx.lineWidth = 4.4;
  ctx.beginPath();
  ctx.moveTo(50, 18);
  ctx.lineTo(50, 74);
  ctx.moveTo(40, 28);
  ctx.lineTo(60, 28);
  ctx.moveTo(42, 44);
  ctx.lineTo(58, 52);
  ctx.moveTo(58, 44);
  ctx.lineTo(42, 52);
  ctx.moveTo(40, 66);
  ctx.lineTo(60, 66);
  ctx.stroke();
  ctx.restore();

  // Red seal
  ctx.save();
  ctx.beginPath();
  ctx.rect(56, 70, 14, 14);
  ctx.fillStyle = 'rgba(190,28,48,0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,10,26,0.9)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();

  [
    [26, 24, 5],
    [76, 60, 4],
    [70, 20, 3],
  ].forEach(([sx, sy, sr]) => {
    starPath(ctx, sx as number, sy as number, sr as number, (sr as number) * 0.3, 4);
    ctx.fillStyle = hexToRgba('#C9A6FF', 0.85);
    ctx.fill();
  });
};

export const GLYPHS: Record<SymbolId, GlyphPainter> = {
  kasa,
  kitsune,
  okami,
  tanuki,
  teapot,
  cup,
  lantern,
  fan,
  incense,
  wild,
  scatter,
  mystery,
};
