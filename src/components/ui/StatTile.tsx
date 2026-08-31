import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'gold' | 'cyan' | 'violet' | 'emerald';
  className?: string;
  children?: ReactNode;
}

const ACCENTS = {
  gold: 'text-gold-light',
  cyan: 'text-cyan-neon',
  violet: 'text-violet-neon',
  emerald: 'text-emerald-neon',
} as const;

export function StatTile({ label, value, hint, accent = 'gold', className, children }: StatTileProps): JSX.Element {
  return (
    <div
      className={cn(
        'glass-panel gold-hairline flex min-w-[128px] flex-col justify-center rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5',
        className,
      )}
    >
      <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:text-[10px]">
        {label}
      </span>
      <span className={cn('stat-value text-lg font-bold leading-tight sm:text-xl', ACCENTS[accent])}>{value}</span>
      {hint && <span className="text-[9px] uppercase tracking-widest text-slate-500">{hint}</span>}
      {children}
    </div>
  );
}
