import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { ParticleCanvas } from '@/components/common/ParticleCanvas';
import { useCountUp } from '@/hooks/useCountUp';
import { soundEngine } from '@/audio/SoundEngine';
import type { WinTier } from '@/types';
import { formatCredits } from '@/utils/format';
import { TIER_LABEL, tierFor } from '@/utils/spinEngine';

interface BigWinOverlayProps {
  visible: boolean;
  tier: WinTier;
  amount: number;
  bet: number;
  duration: number;
  /** Fused Rune Orb multiplier that produced this win, if any. */
  orbMultiplier?: number;
  tumbles?: number;
}

const TIER_STYLE: Record<string, { from: string; to: string; ray: string; shower: string[] }> = {
  big: {
    from: '#FFF8E2',
    to: '#F8C65B',
    ray: 'rgba(248,198,91,0.5)',
    shower: ['#F8C65B', '#FFE9AE'],
  },
  mega: {
    from: '#FFFFFF',
    to: '#8A4DFF',
    ray: 'rgba(138,77,255,0.55)',
    shower: ['#F8C65B', '#8A4DFF', '#25D9FF'],
  },
  epic: {
    from: '#FFFFFF',
    to: '#FF4D6D',
    ray: 'rgba(255,77,109,0.55)',
    shower: ['#F8C65B', '#FF4D6D', '#25D9FF', '#28D6A0'],
  },
};

/**
 * Celebration layer for Big / Mega / Epic demo wins.
 *
 * The counter drives the headline: as the number climbs past each threshold the
 * title upgrades under it, so a huge win *escalates* on screen instead of
 * announcing its size up front.
 */
export function BigWinOverlay({
  visible,
  tier,
  amount,
  bet,
  duration,
  orbMultiplier = 0,
  tumbles = 0,
}: BigWinOverlayProps): JSX.Element {
  const counted = useCountUp(visible ? amount : 0, {
    duration,
    onTick: (step) => visible && soundEngine.tick(step),
  });

  // Tier of the number *currently on screen*, so the headline escalates.
  const liveTier = visible ? tierFor(Math.max(counted, 1), bet) : tier;
  const shown: WinTier = liveTier === 'none' || liveTier === 'small' || liveTier === 'nice' ? 'big' : liveTier;
  const style = TIER_STYLE[shown] ?? TIER_STYLE.big!;

  const lastTier = useRef<WinTier | null>(null);
  useEffect(() => {
    if (!visible) {
      lastTier.current = null;
      return;
    }
    if (lastTier.current !== null && lastTier.current !== shown) {
      soundEngine.tierUp();
    }
    lastTier.current = shown;
  }, [shown, visible]);

  const multiple = bet > 0 ? amount / bet : 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-40 grid place-items-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-live="polite"
        >
          <div className="absolute inset-0 bg-night-900/72" />

          {/* Rotating god-rays */}
          <div
            className="absolute h-[190vmax] w-[190vmax] opacity-60"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, ${style.ray} 8deg, transparent 16deg, transparent 30deg, ${style.ray} 38deg, transparent 46deg)`,
              animation: 'portalSpin 18s linear infinite',
              maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
              WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
              willChange: 'transform',
            }}
          />

          {/* Light bloom behind the number */}
          <motion.div
            className="absolute h-[70vmin] w-[70vmin] rounded-full"
            style={{
              background: `radial-gradient(circle, ${style.ray} 0%, transparent 68%)`,
              willChange: 'transform, opacity',
            }}
            animate={{ scale: [0.9, 1.12, 0.9], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Coin and gem shower — one canvas for the whole field */}
          <ParticleCanvas mode="shower" colors={style.shower} count={shown === 'epic' ? 90 : 64} speed={1.1} />

          <motion.div
            className="relative flex flex-col items-center gap-3 px-6 text-center"
            initial={{ scale: 0.6, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          >
            <AnimatePresence mode="popLayout">
              <motion.h2
                key={shown}
                className="font-display text-5xl uppercase tracking-[0.14em] sm:text-7xl"
                style={{
                  background: `linear-gradient(180deg, ${style.from} 0%, ${style.to} 100%)`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  filter: 'drop-shadow(0 0 28px rgba(248,198,91,0.6))',
                }}
                initial={{ scale: 0.4, opacity: 0, rotate: -6 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 1.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              >
                {TIER_LABEL[shown]}
              </motion.h2>
            </AnimatePresence>

            <p className="stat-value text-4xl font-bold text-gold-light sm:text-6xl">
              {formatCredits(counted)}
            </p>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-neon/80">
              Demo points · {multiple.toFixed(1)}× stake
            </p>

            {(orbMultiplier > 0 || tumbles > 0) && (
              <motion.div
                className="flex flex-wrap items-center justify-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {tumbles > 0 && (
                  <span className="rounded-full border border-cyan-neon/50 bg-cyan-neon/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-neon">
                    {tumbles} tumble{tumbles === 1 ? '' : 's'}
                  </span>
                )}
                {orbMultiplier > 0 && (
                  <span className="stat-value rounded-full border border-gold/60 bg-gold/15 px-3 py-1 text-sm font-bold text-gold-light">
                    Rune Orbs ×{orbMultiplier}
                  </span>
                )}
              </motion.div>
            )}

            <p className="max-w-md text-[11px] leading-relaxed text-slate-400">
              Visual celebration only. Demo points hold no monetary value and cannot be exchanged.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
