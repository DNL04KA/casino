import type { GuardianId } from '@/types';

interface GuardianEmblemProps {
  guardian: GuardianId;
  size?: number;
  className?: string;
}

/** Hand-built SVG sigils — one per Guardian, used on cards and the bonus HUD. */
export function GuardianEmblem({ guardian, size = 96, className }: GuardianEmblemProps): JSX.Element {
  const gradientId = `emblem-${guardian}`;
  const palette: Record<GuardianId, [string, string]> = {
    dragon: ['#25D9FF', '#F8C65B'],
    tiger: ['#FF4D6D', '#F8C65B'],
    moon: ['#8A4DFF', '#C9A6FF'],
  };
  const [from, to] = palette[guardian];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#${gradientId}-glow)`}>
        <polygon
          points="60,6 108,33 108,87 60,114 12,87 12,33"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.5"
          opacity="0.85"
        />
        <circle cx="60" cy="60" r="34" fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.4" opacity="0.5" />

        {guardian === 'dragon' && (
          <g stroke={`url(#${gradientId})`} strokeWidth="3.5" fill="none" strokeLinecap="round">
            <path d="M38 82c-8-14 6-20 10-30 3-8 12-14 22-11" />
            <path d="M70 41c10 1 16 8 16 16 0 7-5 11-11 12-7 1-13-3-13-9" />
            <path d="M74 36l10-12M64 38l4-14" />
            <circle cx="76" cy="55" r="3" fill={to} stroke="none" />
          </g>
        )}

        {guardian === 'tiger' && (
          <g stroke={`url(#${gradientId})`} strokeWidth="3.5" fill="none" strokeLinecap="round">
            <path d="M40 44c0-10 9-18 20-18s20 8 20 18c0 18-9 32-20 32S40 62 40 44z" />
            <path d="M34 34l8 6M86 34l-8 6" />
            <path d="M48 50h8M64 50h8" />
            <path d="M60 60v8M52 72c4 4 12 4 16 0" />
            <path d="M36 84c8 6 40 6 48 0" opacity="0.6" />
          </g>
        )}

        {guardian === 'moon' && (
          <g stroke={`url(#${gradientId})`} strokeWidth="3.5" fill="none" strokeLinecap="round">
            <path d="M72 30a30 30 0 100 60 24 24 0 010-60z" />
            <circle cx="46" cy="42" r="2.5" fill={to} stroke="none" />
            <circle cx="40" cy="60" r="2" fill={to} stroke="none" />
            <circle cx="48" cy="78" r="2.5" fill={to} stroke="none" />
            <path d="M60 18v-8M60 110v-8M18 60h-8M110 60h-8" opacity="0.7" />
          </g>
        )}
      </g>
    </svg>
  );
}
