import { useEffect, useRef } from 'react';
import { startParticleField, type ParticleMode } from '@/utils/particleCanvas';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/utils/cn';

interface ParticleCanvasProps {
  mode: ParticleMode;
  colors: string[];
  count: number;
  speed?: number;
  additive?: boolean;
  maxDpr?: number;
  className?: string;
}

/**
 * One canvas, one animation loop, hundreds of motes. Replaces what used to be
 * a DOM node per particle — the single biggest compositor saving in the shell.
 */
export function ParticleCanvas({
  mode,
  colors,
  count,
  speed,
  additive,
  maxDpr,
  className,
}: ParticleCanvasProps): JSX.Element {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduceMotion = useReducedMotion();
  const key = `${mode}|${colors.join(',')}|${count}|${speed ?? 1}|${additive}|${maxDpr}`;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;

    const field = startParticleField(canvas, { mode, colors, count, speed, additive, maxDpr }, reduceMotion);
    const onResize = () => field.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      field.stop();
    };
    // `key` folds the spec into one primitive so the field restarts only when
    // it genuinely changes, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduceMotion]);

  return <canvas ref={ref} className={cn('pointer-events-none absolute inset-0 h-full w-full', className)} aria-hidden="true" />;
}
