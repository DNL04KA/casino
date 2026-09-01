import { AnimatePresence, motion } from 'framer-motion';
import { GUARDIAN_MAP } from '@/data/guardians';
import { GuardianEmblem } from '@/components/common/GuardianEmblem';
import { useCountUp } from '@/hooks/useCountUp';
import { soundEngine } from '@/audio/SoundEngine';
import type { GuardianId } from '@/types';
import { formatCredits } from '@/utils/format';

interface BonusSummaryProps {
  visible: boolean;
  title: string;
  subtitle: string;
  total: number;
  spins: number;
  guardian: GuardianId | null;
  onContinue: () => void;
}

/** Closing screen of the bonus round with a cinematic return to the base game. */
export function BonusSummary({
  visible,
  title,
  subtitle,
  total,
  spins,
  guardian,
  onContinue,
}: BonusSummaryProps): JSX.Element {
  const counted = useCountUp(visible ? total : 0, {
    duration: 1800,
    onTick: (step) => visible && soundEngine.tick(step),
  });
  const colors = guardian ? GUARDIAN_MAP[guardian].colors : { primary: '#F8C65B', aura: 'rgba(248,198,91,0.5)' };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.45 }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="absolute inset-0 bg-night-900/95" />
          <div
            className="absolute h-[140vmin] w-[140vmin] opacity-45"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${colors.aura}, transparent, ${colors.aura}, transparent)`,
              animation: 'portalSpin 22s linear infinite',
              maskImage: 'radial-gradient(circle, #000 0%, transparent 60%)',
              WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 60%)',
            }}
          />

          <motion.div
            className="glass-panel gold-hairline relative flex w-full max-w-lg flex-col items-center gap-4 rounded-3xl px-6 py-8 text-center"
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 210, damping: 20 }}
            style={{ borderColor: `${colors.primary}66`, boxShadow: `0 0 70px ${colors.aura}` }}
          >
            {guardian && <GuardianEmblem guardian={guardian} size={92} />}

            <div>
              <p className="text-[10px] uppercase tracking-[0.36em] text-cyan-neon/80">{subtitle}</p>
              <h2 className="neon-title mt-1.5 font-display text-2xl uppercase sm:text-3xl">{title}</h2>
            </div>

            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Total demo takings</p>
              <p className="stat-value mt-1 text-4xl font-bold text-gold-light sm:text-5xl">
                {formatCredits(counted)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">across {spins} demo rounds of service</p>
            </div>

            <p className="max-w-sm text-[11px] leading-relaxed text-slate-400">
              Demo points are added to your virtual balance for presentation purposes. They cannot be
              withdrawn, transferred or exchanged for anything.
            </p>

            <button
              type="button"
              onClick={onContinue}
              onMouseEnter={() => soundEngine.hover()}
              className="btn-ghost mt-1 !border-gold/60 !bg-gold/15 !px-8 !py-3 !text-base !text-gold-light hover:!bg-gold/25"
              autoFocus
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
