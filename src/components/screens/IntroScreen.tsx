import { motion } from 'framer-motion';
import { GameLogo } from '@/components/ui/GameLogo';
import { DEMO_DISCLAIMER } from '@/data/config';
import { soundEngine } from '@/audio/SoundEngine';

interface IntroScreenProps {
  onEnter: () => void;
  onOpenInfo: () => void;
}

const HIGHLIGHTS = [
  { title: 'Tumbling wins', detail: 'Winners shatter, the board refills and pays again' },
  { title: 'Rune Orb multipliers', detail: 'Orbs fuse into one multiplier on every win' },
  { title: 'Guardians’ Free Spins', detail: 'Three feature styles and a relic mini-game' },
];

/** Title screen — the first thing a reviewer sees. */
export function IntroScreen({ onEnter, onOpenInfo }: IntroScreenProps): JSX.Element {
  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.55 }}
    >
      <div className="absolute inset-0 bg-night-900/78 backdrop-blur-[3px]" />

      <motion.div
        className="relative flex w-full max-w-2xl flex-col items-center gap-6 text-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 180, damping: 22 }}
      >
        <GameLogo size="lg" className="flex-col gap-4 sm:flex-row" />

        <motion.p
          className="font-display text-lg tracking-[0.32em] text-cyan-neon sm:text-2xl"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          Awaken the Guardians
        </motion.p>

        <p className="max-w-lg text-sm leading-relaxed text-slate-300">
          A playable showcase of reel feel, feature staging and celebration design for a futuristic temple slot.
          Every credit, stake and win on screen is a virtual demo value.
        </p>

        <div className="grid w-full gap-2 sm:grid-cols-3">
          {HIGHLIGHTS.map((item, i) => (
            <motion.div
              key={item.title}
              className="glass-panel gold-hairline rounded-2xl px-3 py-3 text-center"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.1 }}
            >
              <p className="font-display text-[13px] text-gold-light">{item.title}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">{item.detail}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <motion.button
            type="button"
            onClick={onEnter}
            onMouseEnter={() => soundEngine.hover()}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            autoFocus
            className="relative overflow-hidden rounded-2xl px-10 py-4 font-display text-lg uppercase tracking-[0.18em] text-night-900"
            style={{
              background: 'linear-gradient(150deg,#FFE9AE 0%,#F8C65B 45%,#C8912B 100%)',
              boxShadow: '0 0 30px rgba(37,217,255,0.45), 0 0 70px rgba(248,198,91,0.35)',
            }}
          >
            <span
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-white/35"
              style={{ animation: 'shimmerSweep 3s ease-in-out infinite' }}
              aria-hidden="true"
            />
            <span className="relative">Enter Demo</span>
          </motion.button>

          <button type="button" onClick={onOpenInfo} className="btn-ghost !px-6 !py-3">
            How it works
          </button>
        </div>

        <p className="demo-chip rounded-full px-4 py-1.5 text-[10px] font-bold">For Demo Purposes</p>
        <p className="max-w-md text-[10px] leading-relaxed text-slate-500">{DEMO_DISCLAIMER}</p>
      </motion.div>
    </motion.div>
  );
}
