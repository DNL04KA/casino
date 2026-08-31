import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { DEMO_DISCLAIMER } from '@/data/config';

interface PreloaderProps {
  onComplete: () => void;
}

const STEPS = [
  'Carving temple runes',
  'Lighting the neon braziers',
  'Waking the Guardians',
  'Aligning the Temple Gate',
];

/** Animated Temple Gate emblem shown while fonts and textures warm up. */
export function Preloader({ onComplete }: PreloaderProps): JSX.Element {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  // Held in a ref so the loop below is never restarted by a re-render.
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  // The loader can finish from the frame loop or from the failsafe timer —
  // whichever wins, it must only hand over once.
  const finishedRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const start = performance.now();
    const minDuration = 2100;

    // Wait for the display font so the procedurally drawn royals are correct.
    const fontsReady =
      typeof document !== 'undefined' && 'fonts' in document
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve(undefined);

    let fontsDone = false;
    void fontsReady.then(() => {
      fontsDone = true;
    });

    const finish = () => {
      if (cancelled || finishedRef.current) return;
      finishedRef.current = true;
      setProgress(1);
      completeRef.current();
    };

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = now - start;
      const timeRatio = Math.min(1, elapsed / minDuration);
      const target = fontsDone ? 1 : Math.min(0.92, timeRatio);
      setProgress((prev) => prev + (target - prev) * 0.08);
      setStep(Math.min(STEPS.length - 1, Math.floor(timeRatio * STEPS.length)));

      if (timeRatio >= 1 && fontsDone) {
        setProgress(1);
        window.setTimeout(finish, 320);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    // Safety net: requestAnimationFrame is suspended in background tabs, so a
    // demo opened in one would otherwise sit on the loader forever.
    const failsafe = window.setTimeout(finish, 6000);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
    };
  }, []);

  const pct = Math.round(progress * 100);

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5 }}
      role="status"
      aria-live="polite"
      aria-label={`Loading demo, ${pct} percent`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_10%,#1B1140_0%,#08111F_60%,#04070E_100%)]" />

      <div className="relative flex flex-col items-center gap-7 px-6">
        <div className="relative grid h-40 w-40 place-items-center">
          <span
            className="absolute inset-0 rounded-full opacity-60"
            style={{
              background:
                'conic-gradient(from 0deg, transparent, rgba(37,217,255,0.55), transparent, rgba(138,77,255,0.55), transparent)',
              animation: 'portalSpin 4.2s linear infinite',
              maskImage: 'radial-gradient(circle, transparent 58%, #000 62%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 58%, #000 62%)',
            }}
          />
          <svg viewBox="0 0 120 120" className="h-32 w-32" aria-hidden="true">
            <defs>
              <linearGradient id="preGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFE9AE" />
                <stop offset="60%" stopColor="#F8C65B" />
                <stop offset="100%" stopColor="#8A4DFF" />
              </linearGradient>
            </defs>
            <motion.path
              d="M60 10 L102 34 V86 L60 110 L18 86 V34 Z"
              fill="none"
              stroke="url(#preGold)"
              strokeWidth="2.6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
            />
            <motion.g
              stroke="#25D9FF"
              strokeWidth="3"
              strokeLinecap="round"
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              <path d="M60 28v64M36 44h48" />
            </motion.g>
            <motion.circle
              cx="60"
              cy="60"
              r="9"
              fill="#FFE9AE"
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ transformOrigin: '60px 60px' }}
            />
          </svg>
        </div>

        <div className="w-[min(78vw,340px)]">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-neon via-violet-neon to-gold transition-[width] duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-slate-400">
            <span>{STEPS[step]}</span>
            <span className="stat-value">{pct}%</span>
          </div>
        </div>

        <p className="max-w-sm text-center text-[10px] leading-relaxed text-slate-600">{DEMO_DISCLAIMER}</p>
      </div>
    </motion.div>
  );
}
