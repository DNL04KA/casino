import { motion } from 'framer-motion';
import { GUARDIAN_MAP } from '@/data/guardians';
import { GuardianEmblem } from '@/components/common/GuardianEmblem';
import type { BonusState } from '@/types';
import { formatCredits, formatMultiplier } from '@/utils/format';

interface FreeSpinsHudProps {
  bonus: BonusState;
}

/** Persistent HUD shown for the duration of the Guardians’ Free Spins round. */
export function FreeSpinsHud({ bonus }: FreeSpinsHudProps): JSX.Element | null {
  if (!bonus.active || !bonus.guardian || bonus.choosing) return null;

  const guardian = GUARDIAN_MAP[bonus.guardian];
  const used = bonus.spinsTotal - bonus.spinsLeft;
  const progress = bonus.spinsTotal > 0 ? (used / bonus.spinsTotal) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      className="pointer-events-none fixed left-1/2 top-2 z-30 w-[min(92%,720px)] -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div
        className="glass-panel gold-hairline flex items-center gap-3 rounded-2xl px-3 py-2 sm:gap-4 sm:px-5 sm:py-3"
        style={{ borderColor: `${guardian.colors.primary}66`, boxShadow: `0 0 40px ${guardian.colors.aura}` }}
      >
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 30px ${guardian.colors.aura}` }}
            aria-hidden="true"
          />
          <GuardianEmblem guardian={guardian.id} size={46} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[10px] uppercase tracking-[0.3em] text-slate-400">
              {guardian.title} · {guardian.feature}
            </p>
            <p className="stat-value shrink-0 text-sm font-bold" style={{ color: guardian.colors.primary }}>
              {bonus.spinsLeft} <span className="text-[10px] text-slate-400">/ {bonus.spinsTotal} left</span>
            </p>
          </div>

          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${guardian.colors.primary}, ${guardian.colors.secondary})`,
              }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
            />
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[9px] uppercase tracking-[0.26em] text-slate-400">Demo total</p>
          <p className="stat-value text-base font-bold text-gold-light sm:text-lg">
            {formatCredits(bonus.total)}
          </p>
        </div>

        <div
          className="shrink-0 rounded-xl border px-2.5 py-1.5 text-center"
          style={{ borderColor: `${guardian.colors.primary}66`, background: `${guardian.colors.primary}14` }}
        >
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Mult</p>
          <p className="stat-value text-base font-bold" style={{ color: guardian.colors.primary }}>
            {formatMultiplier(bonus.multiplier)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
