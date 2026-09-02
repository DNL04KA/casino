import { useEffect, useRef, useState } from 'react';
import { PARCEL_CELL, getPaintedSheet, isPaintedReady, onPaintedReady } from '@/game/art/paintedSymbols';
import { cn } from '@/utils/cn';

interface ParcelCanvasProps {
  size?: number;
  className?: string;
}

/** The wrapped furoshiki bundle that fronts every card in the mini-game. */
export function ParcelCanvas({ size = 64, className }: ParcelCanvasProps): JSX.Element {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(isPaintedReady);
  useEffect(() => onPaintedReady(() => setReady(true)), []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const sheet = getPaintedSheet(PARCEL_CELL.sheet);
    if (!sheet) return;
    const ratio = Math.min(size / PARCEL_CELL.sw, size / PARCEL_CELL.sh) * 0.94;
    const w = PARCEL_CELL.sw * ratio;
    const h = PARCEL_CELL.sh * ratio;
    ctx.drawImage(
      sheet,
      PARCEL_CELL.sx,
      PARCEL_CELL.sy,
      PARCEL_CELL.sw,
      PARCEL_CELL.sh,
      (size - w) / 2,
      (size - h) / 2,
      w,
      h,
    );
  }, [size, ready]);

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      className={cn('block', className)}
      aria-hidden="true"
    />
  );
}
