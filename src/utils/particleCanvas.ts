/**
 * A tiny sprite-based particle engine on a single canvas.
 *
 * The point is cost: a DOM particle field means one animated element (and one
 * compositor layer) per mote, which is what makes ambient effects tank a frame
 * budget. Here every mote is a pre-rendered sprite blitted with `drawImage`,
 * so a few hundred particles cost one canvas and one rAF loop.
 */

export type ParticleMode = 'ambient' | 'shower';

export interface ParticleSpec {
  mode: ParticleMode;
  /** Sprite colours the field draws from. */
  colors: string[];
  /** Target population. */
  count: number;
  /** Multiplies every velocity — lets callers slow a scene down. */
  speed?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  life: number;
  maxLife: number;
  rot: number;
  vrot: number;
  sprite: number;
  alpha: number;
}

/** Soft round glow, used for embers and dust. */
function makeGlowSprite(color: string, size = 32): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color);
  g.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

/** A struck coin — the celebration workhorse. */
function makeCoinSprite(color: string, size = 44): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const r = size / 2;

  const body = ctx.createLinearGradient(size * 0.2, size * 0.1, size * 0.8, size * 0.9);
  body.addColorStop(0, '#FFF8E2');
  body.addColorStop(0.35, color);
  body.addColorStop(0.62, '#B8841F');
  body.addColorStop(1, '#FFE9AE');
  ctx.beginPath();
  ctx.arc(r, r, r * 0.86, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(r, r, r * 0.64, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(120,84,14,0.55)';
  ctx.lineWidth = size * 0.05;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(r * 0.72, r * 0.66, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  return c;
}

/** A faceted shard that reads as a gem chip when it tumbles. */
function makeShardSprite(color: string, size = 34): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const r = size / 2;
  ctx.beginPath();
  ctx.moveTo(r, size * 0.06);
  ctx.lineTo(size * 0.9, r);
  ctx.lineTo(r, size * 0.94);
  ctx.lineTo(size * 0.1, r);
  ctx.closePath();
  const g = ctx.createLinearGradient(size * 0.2, 0, size * 0.8, size);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(0.4, color);
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = size * 0.05;
  ctx.stroke();
  return c;
}

export interface ParticleField {
  /** Re-reads the element size; call on resize. */
  resize: () => void;
  stop: () => void;
}

/**
 * Starts a particle field on `canvas`. Returns a handle whose `stop()` cancels
 * the loop — always call it on unmount.
 */
export function startParticleField(
  canvas: HTMLCanvasElement,
  spec: ParticleSpec,
  reduceMotion = false,
): ParticleField {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { resize: () => {}, stop: () => {} };

  // Particles are soft and forgiving, so a capped ratio saves a lot of fill.
  const dpr = Math.min(1.5, window.devicePixelRatio || 1);
  const speed = spec.speed ?? 1;
  const sprites =
    spec.mode === 'shower'
      ? spec.colors.flatMap((color) => [makeCoinSprite(color), makeShardSprite(color)])
      : spec.colors.map((color) => makeGlowSprite(color));

  let width = 0;
  let height = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const spawn = (particle: Particle, initial: boolean): void => {
    particle.sprite = Math.floor(Math.random() * sprites.length);
    particle.rot = Math.random() * Math.PI * 2;
    if (spec.mode === 'shower') {
      particle.x = Math.random() * width;
      particle.y = initial ? Math.random() * height : -40 - Math.random() * height * 0.5;
      particle.vx = (Math.random() - 0.5) * 0.06 * speed;
      particle.vy = (0.18 + Math.random() * 0.3) * speed;
      particle.vrot = (Math.random() - 0.5) * 0.008;
      particle.scale = 0.45 + Math.random() * 0.75;
      particle.maxLife = height / (particle.vy * 1000) + 1.5;
      particle.alpha = 1;
    } else {
      particle.x = Math.random() * width;
      particle.y = initial ? Math.random() * height : height + 20;
      particle.vx = (Math.random() - 0.5) * 0.018 * speed;
      particle.vy = -(0.012 + Math.random() * 0.03) * speed;
      particle.vrot = 0;
      particle.scale = 0.14 + Math.random() * 0.4;
      particle.maxLife = 9 + Math.random() * 11;
      particle.alpha = 0.35 + Math.random() * 0.5;
    }
    particle.life = initial ? Math.random() * particle.maxLife : 0;
  };

  const particles: Particle[] = Array.from({ length: spec.count }, () => {
    const p: Particle = {
      x: 0, y: 0, vx: 0, vy: 0, scale: 1, life: 0, maxLife: 1, rot: 0, vrot: 0, sprite: 0, alpha: 1,
    };
    spawn(p, true);
    return p;
  });

  let raf = 0;
  let last = performance.now();
  let running = true;

  const frame = (now: number) => {
    if (!running) return;
    // A tab that was hidden hands back a huge delta; clamp so nothing teleports.
    const dt = Math.min(64, now - last);
    last = now;
    const seconds = dt / 1000;

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = spec.mode === 'ambient' ? 'lighter' : 'source-over';

    for (const p of particles) {
      p.life += seconds;
      if (p.life > p.maxLife || p.y > height + 60) {
        spawn(p, false);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;

      const t = p.life / p.maxLife;
      // Fade in over the first tenth, out over the last third.
      const fade = t < 0.1 ? t / 0.1 : t > 0.7 ? Math.max(0, (1 - t) / 0.3) : 1;
      const sprite = sprites[p.sprite] as HTMLCanvasElement;
      const size = sprite.width * p.scale;

      ctx.globalAlpha = p.alpha * fade;
      if (p.vrot === 0) {
        ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
    }

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  };

  if (!reduceMotion) {
    raf = requestAnimationFrame(frame);
  } else {
    // Still paint one static frame so the scene is not empty.
    ctx.clearRect(0, 0, width, height);
  }

  return {
    resize,
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
