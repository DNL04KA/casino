import { useEffect, useRef, useState } from 'react';

/**
 * A frame-rate readout. Small, but it turns "it feels laggy" into a number
 * anyone can quote, which is the only way to tune a real device you cannot
 * profile yourself.
 */
export function FpsMeter(): JSX.Element {
  const [fps, setFps] = useState(0);
  const [worst, setWorst] = useState(0);
  const frames = useRef(0);
  const since = useRef(performance.now());
  const slowest = useRef(0);
  const lastFrame = useRef(performance.now());

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const delta = now - lastFrame.current;
      lastFrame.current = now;
      if (delta > slowest.current) slowest.current = delta;

      frames.current += 1;
      const elapsed = now - since.current;
      if (elapsed >= 500) {
        setFps(Math.round((frames.current * 1000) / elapsed));
        setWorst(Math.round(slowest.current));
        frames.current = 0;
        since.current = now;
        slowest.current = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tone = fps >= 50 ? 'text-emerald-neon' : fps >= 30 ? 'text-gold-light' : 'text-crimson-neon';

  return (
    <div
      className="pointer-events-none fixed bottom-2 left-2 z-50 rounded-lg border border-white/15 bg-night-900/85 px-2 py-1 font-numeric text-[11px] leading-tight"
      role="status"
      aria-live="off"
    >
      <span className={tone}>{fps} fps</span>
      <span className="ml-2 text-slate-500">worst {worst}ms</span>
    </div>
  );
}
