import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import { RELIC_PICKS } from '@/data/config';
import { soundEngine } from '@/audio/SoundEngine';
import type { RelicState } from '@/types';
import { formatCredits } from '@/utils/format';
import { cn } from '@/utils/cn';

interface PickRelicProps {
  visible: boolean;
  relic: RelicState;
  onPick: (index: number) => void;
  onContinue: () => void;
}

const SEAL_PATHS = [
  'M32 6 58 20v24L32 58 6 44V20z',
  'M32 4l10 18 20 4-14 15 3 21-19-10-19 10 3-21L2 26l20-4z',
  'M12 12h40v40H12z M22 22h20v20H22z',
  'M32 4a28 28 0 100 56 28 28 0 000-56z M32 16v32M16 32h32',
];

/** "Pick a Relic" mini-game: three sealed relics opened with a 3D flip. */
export function PickRelic({ visible, relic, onPick, onContinue }: PickRelicProps): JSX.Element {
  const dust = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 3,
        delay: Math.random() * 4,
        duration: 4 + Math.random() * 5,
      })),
    [],
  );

  const picksMade = RELIC_PICKS - relic.picksLeft;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center overflow-hidden px-3 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          role="dialog"
          aria-modal="true"
          aria-label="Pick a Relic bonus"
        >
          {/* Tension backdrop */}
          <div className="absolute inset-0 bg-night-900/94" />
          <div
            className="absolute left-1/2 top-0 h-full w-[60vmin] -translate-x-1/2"
            style={{
              background:
                'linear-gradient(180deg, rgba(248,198,91,0.22) 0%, rgba(248,198,91,0.06) 45%, transparent 100%)',
              filter: 'blur(28px)',
            }}
          />
          <div className="absolute inset-0">
            {dust.map((mote) => (
              <motion.span
                key={mote.id}
                className="absolute rounded-full bg-gold"
                style={{
                  left: `${mote.x}%`,
                  top: `${mote.y}%`,
                  width: mote.size,
                  height: mote.size,
                  boxShadow: '0 0 8px rgba(248,198,91,0.9)',
                }}
                animate={{ y: [-12, 12, -12], opacity: [0.2, 0.85, 0.2] }}
                transition={{ duration: mote.duration, delay: mote.delay, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </div>

          <div className="relative w-full max-w-3xl">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.45em] text-gold/80">Rare temple event</p>
              <h2 className="neon-title mt-1 font-display text-3xl uppercase sm:text-5xl">Pick a Relic</h2>
              <p className="mt-2 text-xs text-slate-400">
                {relic.finished
                  ? 'The vault seals itself again.'
                  : `Choose ${relic.picksLeft} more relic${relic.picksLeft === 1 ? '' : 's'} — ${picksMade}/${RELIC_PICKS} opened.`}
              </p>
            </div>

            <div className="mx-auto mt-4 grid max-w-[640px] grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-2.5">
              {relic.cards.map((card) => {
                const disabled = card.revealed || relic.picksLeft <= 0;
                return (
                  <div key={card.index} className="perspective-1000">
                    <motion.button
                      type="button"
                      disabled={disabled}
                      onMouseEnter={() => !disabled && soundEngine.hover()}
                      onClick={() => onPick(card.index)}
                      whileHover={disabled ? undefined : { y: -5, scale: 1.03 }}
                      whileTap={disabled ? undefined : { scale: 0.96 }}
                      aria-label={
                        card.revealed && card.reward
                          ? `${card.name} opened: ${card.reward.label}`
                          : `Open sealed relic ${card.index + 1}`
                      }
                      className={cn(
                        'card-relic relative block aspect-[4/5] w-full rounded-xl',
                        card.revealed && 'is-flipped',
                        disabled && !card.revealed && 'opacity-45',
                      )}
                    >
                      {/* Sealed face */}
                      <span className="card-face glass-flat gold-hairline absolute inset-0 grid place-items-center rounded-xl">
                        <svg viewBox="0 0 64 64" className="h-1/2 w-1/2 text-gold/70" aria-hidden="true">
                          <path
                            d={SEAL_PATHS[card.index % SEAL_PATHS.length]}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="absolute bottom-1.5 text-[8px] uppercase tracking-[0.16em] text-slate-500">
                          Sealed
                        </span>
                      </span>

                      {/* Revealed face */}
                      <span
                        className="card-face card-face--back absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-center"
                        style={{
                          background: card.reward
                            ? `linear-gradient(160deg, ${card.reward.color}33, rgba(8,17,31,0.94))`
                            : undefined,
                          border: `1px solid ${card.reward?.color ?? '#F8C65B'}88`,
                          boxShadow: `0 0 26px ${card.reward?.color ?? '#F8C65B'}44`,
                        }}
                      >
                        <span className="text-[8px] uppercase tracking-[0.14em] text-slate-300">{card.name}</span>
                        <span
                          className="font-display text-[10px] leading-tight"
                          style={{ color: card.reward?.color }}
                        >
                          {card.reward?.label}
                        </span>
                        <span className="stat-value text-[10px] font-bold text-gold-light">
                          +{card.reward?.points ?? 0}× stake
                        </span>
                      </span>
                    </motion.button>
                  </div>
                );
              })}
            </div>

            <AnimatePresence>
              {relic.finished && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-flat gold-hairline mx-auto mt-4 flex max-w-xl flex-col items-center gap-1.5 rounded-3xl px-5 py-3 text-center"
                >
                  <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-neon/80">Relic hunt complete</p>
                  <p className="stat-value text-3xl font-bold text-gold-light sm:text-4xl">
                    {formatCredits(relic.total)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Total demo points from three relics. Visual reward only — nothing here has cash value.
                  </p>
                  <button
                    type="button"
                    onClick={onContinue}
                    onMouseEnter={() => soundEngine.hover()}
                    className="btn-ghost mt-1 !border-gold/60 !bg-gold/15 !px-6 !py-2.5 !text-gold-light hover:!bg-gold/25"
                  >
                    Continue
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
