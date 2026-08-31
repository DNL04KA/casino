import { AnimatePresence, motion } from 'framer-motion';
import type { RoundProgress } from '@/types';
import { formatCredits } from '@/utils/format';

interface RoundBannerProps {
  progress: RoundProgress;
}

/**
 * Live read-out of the tumble chain: how many times the board has collapsed,
 * what the round is worth so far, and the fused Rune Orb multiplier.
 */
export function RoundBanner({ progress }: RoundBannerProps): JSX.Element {
  const showChain = progress.active && progress.tumble > 0;
  const showTotal = progress.active && progress.running > 0;

  return (
    <div className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-1/2">
      <AnimatePresence mode="popLayout">
        {(showChain || showTotal || progress.collecting) && (
          <motion.div
            key="round-banner"
            initial={{ opacity: 0, y: -14, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="glass-panel flex items-center gap-2.5 whitespace-nowrap rounded-full border-gold/60 px-3 py-1.5 shadow-neon-gold sm:gap-4 sm:px-5 sm:py-2"
            role="status"
            aria-live="polite"
          >
            {showChain && (
              <motion.span
                key={progress.tumble}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5"
              >
                <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-neon/80 sm:text-[10px]">
                  Tumble
                </span>
                <span className="stat-value rounded-full bg-cyan-neon/15 px-2 py-0.5 text-sm font-bold text-cyan-neon sm:text-base">
                  ×{progress.tumble}
                </span>
              </motion.span>
            )}

            {showTotal && (
              <span className="flex items-center gap-1.5">
                <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:text-[10px]">
                  Round
                </span>
                <span className="stat-value text-sm font-bold text-gold-light sm:text-lg">
                  {formatCredits(progress.running)}
                </span>
              </span>
            )}

            <AnimatePresence>
              {progress.collecting && progress.orbMultiplier > 0 && (
                <motion.span
                  key="orb-mult"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/15 px-2.5 py-0.5"
                >
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-light/80">
                    Orbs
                  </span>
                  <span className="stat-value text-sm font-bold text-gold-light sm:text-lg">
                    ×{progress.orbMultiplier}
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
