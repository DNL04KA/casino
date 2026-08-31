import { useEffect, useRef } from 'react';
import { drawSymbolTile } from '@/game/art/drawSymbol';
import type { SymbolId } from '@/types';
import { cn } from '@/utils/cn';

interface SymbolCanvasProps {
  id: SymbolId;
  size?: number;
  className?: string;
}

/**
 * The paytable and info screens reuse the exact same procedural art the reels
 * do — one drawing routine, two renderers.
 */
export function SymbolCanvas({ id, size = 96, className }: SymbolCanvasProps): JSX.Element {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSymbolTile(ctx, id, size);
  }, [id, size]);

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      className={cn('block', className)}
      role="img"
      aria-hidden="true"
    />
  );
}
