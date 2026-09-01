import { useEffect, useRef } from 'react';
import type { GuardianId } from '@/types';
import { GUARDIAN_MAP } from '@/data/guardians';
import { drawPillar } from '@/game/art/drawPillar';

interface RunePillarProps {
  side: 'left' | 'right';
  guardian: GuardianId | null;
  /** Celebrations push the panel's inlay to full brightness. */
  excited?: boolean;
  /**
   * How charged the panel reads, 0–6. Driven by the tumble chain, so the
   * cabinet itself lights up as a round keeps paying.
   */
  energy?: number;
}

/** Rosette centres sit at these heights, matching the canvas composition. */
const STONE_POSITIONS = ['21.5%', '49.5%', '77.5%'];

/**
 * A carved side panel flanking the reels: engine-turned rosettes, beaded gold
 * bands and a stone shaft, drawn on canvas with the same sculpting toolkit as
 * the symbols. The rosette stones are live — they ignite from the bottom up as
 * the round builds.
 */
export function RunePillar({
  side,
  guardian,
  excited = false,
  energy = 0,
}: RunePillarProps): JSX.Element {
  const accent = guardian ? GUARDIAN_MAP[guardian].colors.primary : '#25D9FF';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;

    const paint = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawPillar(ctx, rect.width, rect.height, accent);
    };

    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [accent]);

  // Stones light from the bottom up; a celebration blazes the whole panel.
  const litStones = excited ? STONE_POSITIONS.length : Math.min(STONE_POSITIONS.length, Math.ceil(energy / 2));
  const seam = excited ? 1 : Math.min(1, energy / 6);

  return (
    <div
      ref={wrapRef}
      className="relative hidden h-full w-[104px] shrink-0 lg:block xl:w-[136px] 2xl:w-[164px]"
      style={{ transform: side === 'right' ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Live inlay: the seams brighten as the round charges */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-full transition-opacity duration-500"
        style={{
          opacity: 0.25 + seam * 0.75,
          background: `linear-gradient(180deg, transparent 6%, ${accent}22 50%, transparent 94%)`,
        }}
      />

      {/* Rosette stones ignite from the base up */}
      {STONE_POSITIONS.map((top, i) => {
        const lit = STONE_POSITIONS.length - i <= litStones;
        return (
          <span
            key={top}
            className="pointer-events-none absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500"
            style={{
              top,
              background: lit ? '#FFFFFF' : accent,
              opacity: lit ? 1 : 0.35,
              boxShadow: lit
                ? `0 0 10px 3px ${accent}, 0 0 26px 10px ${accent}66`
                : `0 0 6px 1px ${accent}55`,
            }}
          />
        );
      })}
    </div>
  );
}
