import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import { useCountUp } from '@/hooks/useCountUp';
import { soundEngine } from '@/audio/SoundEngine';
import type { WinTier } from '@/types';
import { formatCredits } from '@/utils/format';
import { TIER_LABEL } from '@/utils/spinEngine';

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

const TIER_STYLE: Record<string, { from: string; to: string; ray: string }> = {
  big: { from: '#FFE9AE', to: '#F8C65B', ray: 'rgba(248,198,91,0.5)' },
  mega: { from: '#FFE9AE', to: '#8A4DFF', ray: 'rgba(138,77,255,0.55)' },
  epic: { from: '#FFFFFF', to: '#FF4D6D', ray: 'rgba(255,77,109,0.55)' },
};

/** Celebration layer for Big / Mega / Epic demo wins. */
export function BigWinOverlay({
  visible,
  tier,
  amount,
  bet,
  duration,
  orbMultiplier = 0,
  tumbles = 0,
}: BigWinOverlayProps): JSX.Element {
  const style = TIER_STYLE[tier] ?? TIER_STYLE.big!;
  const counted = useCountUp(visible ? amount : 0, {
    duration,
    onTick: (step) => visible && soundEngine.tick(step),
  });

  const confetti = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.2 + Math.random() * 2.4,
        rotate: Math.random() * 720 - 360,
        size: 5 + Math.random() * 10,
        color: ['#F8C65B', '#FFE9AE', '#25D9FF', '#8A4DFF', '#28D6A0'][i % 5] as string,
      })),
    [],
  );

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
          <div className="absolute inset-0 bg-night-900/72 backdrop-blur-[3px]" />

          {/* Rotating god-rays */}
          <div
            className="absolute h-[190vmax] w-[190vmax] opacity-60"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, ${style.ray} 8deg, transparent 16deg, transparent 30deg, ${style.ray} 38deg, transparent 46deg)`,
              animation: 'portalSpin 18s linear infinite',
              maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
              WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
            }}
          />

          {/* Confetti */}
          <div className="absolute inset-0">
            {confetti.map((piece) => (
              <motion.span
                key={piece.id}
                className="absolute top-[-6%] block rounded-[2px]"
                style={{
                  left: `${piece.x}%`,
                  width: piece.size,
                  height: piece.size * 0.45,
                  background: piece.color,
                  boxShadow: `0 0 8px ${piece.color}`,
                }}
                initial={{ y: '-10vh', opacity: 0, rotate: 0 }}
                animate={{ y: '112vh', opacity: [0, 1, 1, 0], rotate: piece.rotate }}
                transition={{ duration: piece.duration, delay: piece.delay, ease: 'linear', repeat: Infinity }}
              />
            ))}
          </div>

          <motion.div
            className="relative flex flex-col items-center gap-3 px-6 text-center"
            initial={{ scale: 0.6, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          >
            <motion.h2
              className="font-display text-5xl uppercase tracking-[0.14em] sm:text-7xl"
              style={{
                background: `linear-gradient(180deg, ${style.from} 0%, ${style.to} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 0 28px rgba(248,198,91,0.6))',
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            >
              {TIER_LABEL[tier]}
            </motion.h2>

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
