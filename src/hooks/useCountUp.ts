import { useEffect, useRef, useState } from 'react';

interface CountUpOptions {
  duration?: number;
  onTick?: (step: number) => void;
}

/**
 * Animates a number towards `target`. Used for the Demo Win counter, where the
 * count-up is a core part of the celebration beat.
 */
export function useCountUp(target: number, { duration = 900, onTick }: CountUpOptions = {}): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number>(0);
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    const from = fromRef.current;
    if (from === target || duration <= 0) {
      fromRef.current = target;
      setValue(target);
      return undefined;
    }

    const start = performance.now();
    let lastStep = -1;

    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // easeOutExpo keeps the last digits ticking a little longer.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const next = from + (target - from) * eased;
      setValue(next);

      const bucket = Math.floor(t * 18);
      if (bucket !== lastStep) {
        lastStep = bucket;
        tickRef.current?.(bucket);
      }

      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}
