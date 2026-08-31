import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GUARDIANS } from '@/data/guardians';
import { GuardianEmblem } from '@/components/common/GuardianEmblem';
import { soundEngine } from '@/audio/SoundEngine';
import type { GuardianId } from '@/types';

interface BonusIntroProps {
  visible: boolean;
  turbo: boolean;
  onChoose: (guardian: GuardianId) => void;
}

/**
 * Cinematic Temple Gate transition followed by the Guardian picker.
 * The gate halves swing apart, the camera pushes in, and the board dissolves
 * into particles before the sanctum is revealed.
 */
export function BonusIntro({ visible, turbo, onChoose }: BonusIntroProps): JSX.Element {
  const [stage, setStage] = useState<'gate' | 'choose'>('gate');

  useEffect(() => {
    if (!visible) {
      setStage('gate');
      return undefined;
    }
    const timer = window.setTimeout(() => setStage('choose'), turbo ? 1300 : 3000);
    return () => window.clearTimeout(timer);
  }, [visible, turbo]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="absolute inset-0 bg-night-900/92 backdrop-blur-md" />

          {/* Portal core */}
          <motion.div
            className="absolute rounded-full"
            initial={{ width: 40, height: 40, opacity: 0.2 }}
            animate={{
              width: stage === 'gate' ? ['40px', '70vmin'] : '85vmin',
              height: stage === 'gate' ? ['40px', '70vmin'] : '85vmin',
              opacity: [0.2, 0.85, 0.5],
            }}
            transition={{ duration: turbo ? 1.2 : 2.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background:
                'radial-gradient(circle, #FFFFFF 0%, #25D9FF 18%, #8A4DFF 46%, rgba(19,11,44,0) 72%)',
              filter: 'blur(2px)',
            }}
          />
          <div
            className="absolute h-[120vmin] w-[120vmin] opacity-40"
            style={{
              background:
                'conic-gradient(from 0deg, transparent, rgba(37,217,255,0.5), transparent, rgba(138,77,255,0.5), transparent)',
              animation: 'portalSpin 12s linear infinite',
              maskImage: 'radial-gradient(circle, transparent 26%, #000 42%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 26%, #000 42%, transparent 70%)',
            }}
          />

          {/* Gate halves */}
          {(['left', 'right'] as const).map((side) => (
            <motion.div
              key={side}
              className="absolute top-0 h-full w-1/2"
              style={{
                left: side === 'left' ? 0 : undefined,
                right: side === 'right' ? 0 : undefined,
                background:
                  side === 'left'
                    ? 'linear-gradient(90deg, #0A1122 0%, #16203A 82%, #2A3A63 100%)'
                    : 'linear-gradient(270deg, #0A1122 0%, #16203A 82%, #2A3A63 100%)',
                borderInline: '2px solid rgba(248,198,91,0.4)',
              }}
              initial={{ x: 0 }}
              animate={{ x: side === 'left' ? '-100%' : '100%' }}
              transition={{ duration: turbo ? 0.9 : 2, ease: [0.65, 0, 0.35, 1], delay: turbo ? 0.15 : 0.5 }}
            >
              <div className="flex h-full flex-col items-center justify-center gap-10 opacity-70">
                {['ᛟ', 'ᚦ', 'ᛗ'].map((rune, i) => (
                  <span
                    key={rune}
                    className="text-3xl text-cyan-neon"
                    style={{ animation: `runePulse ${3 + i}s ease-in-out infinite` }}
                  >
                    {rune}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}

          <AnimatePresence>
            {stage === 'gate' && (
              <motion.div
                key="gate-copy"
                className="relative z-10 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-xs uppercase tracking-[0.5em] text-cyan-neon/80">Temple Gate</p>
                <h2 className="neon-title mt-3 font-display text-4xl uppercase tracking-[0.1em] sm:text-6xl">
                  The Gate Opens
                </h2>
                <p className="mt-3 text-sm text-slate-300">Guardians’ Free Spins — demo feature round</p>
              </motion.div>
            )}
            {stage === 'choose' && (
              <motion.div
                key="choose"
                className="relative z-10 w-full max-w-5xl px-4"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-[0.42em] text-cyan-neon/80">Choose your ally</p>
                  <h2 className="neon-title mt-2 font-display text-3xl uppercase sm:text-5xl">
                    Guardians’ Free Spins
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-slate-400">
                    Ten demo free spins. Your choice restyles the round — its colours, captions, particles and
                    which cosmetic feature plays. All results remain virtual.
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
                  {GUARDIANS.map((guardian, index) => (
                    <motion.button
                      key={guardian.id}
                      type="button"
                      onMouseEnter={() => soundEngine.hover()}
                      onClick={() => onChoose(guardian.id)}
                      initial={{ opacity: 0, y: 26 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.09 }}
                      whileHover={{ y: -6 }}
                      whileTap={{ scale: 0.97 }}
                      className="glass-panel gold-hairline group relative flex flex-col items-center gap-3 rounded-3xl px-4 py-5 text-center transition-shadow hover:shadow-neon-gold"
                      style={{ borderColor: `${guardian.colors.primary}55` }}
                      aria-label={`Choose ${guardian.title} — ${guardian.feature}`}
                    >
                      <div
                        className="absolute inset-x-6 top-0 h-[2px] rounded-full opacity-70"
                        style={{ background: `linear-gradient(90deg, transparent, ${guardian.colors.primary}, transparent)` }}
                      />
                      <GuardianEmblem guardian={guardian.id} size={82} />
                      <div>
                        <p
                          className="font-display text-lg tracking-wide"
                          style={{ color: guardian.colors.primary }}
                        >
                          {guardian.name}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{guardian.title}</p>
                      </div>
                      <p className="text-xs font-semibold text-gold-light">{guardian.feature}</p>
                      <p className="text-[11px] leading-relaxed text-slate-400">{guardian.description}</p>
                      <span className="mt-1 rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-300 transition group-hover:border-gold/60 group-hover:text-gold-light">
                        Select
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
