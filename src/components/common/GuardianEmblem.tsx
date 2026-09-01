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
    kasa: ['#F8A65B', '#F8C65B'],
    kitsune: ['#6BE3C0', '#25D9FF'],
    tanuki: ['#FF4D6D', '#F8C65B'],
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

        {guardian === 'kasa' && (
          <g stroke={`url(#${gradientId})`} strokeWidth="3.5" fill="none" strokeLinecap="round">
            {/* Canopy, ribs, shaft — a closed umbrella seen head on */}
            <path d="M30 58c0-16 13-28 30-28s30 12 30 28z" />
            <path d="M30 58c6-6 12-6 18 0M48 58c6-6 12-6 18 0M66 58c6-6 12-6 18 0" />
            <path d="M60 30V18M60 58v34" />
            <path d="M60 92c-8 0-10-8-4-10" />
            <circle cx="60" cy="46" r="5" fill={to} stroke="none" />
          </g>
        )}

        {guardian === 'kitsune' && (
          <g stroke={`url(#${gradientId})`} strokeWidth="3.5" fill="none" strokeLinecap="round">
            {/* Fox mask with three tails behind it */}
            <path d="M40 40l6-16 10 10h8l10-10 6 16c4 20-6 40-20 40S36 60 40 40z" />
            <path d="M50 48h6M64 48h6" />
            <path d="M56 62c3 3 5 3 8 0" />
            <path d="M34 74c-10 4-16 12-16 22M60 82c0 12-4 20-10 26M86 74c10 4 16 12 16 22" opacity="0.75" />
          </g>
        )}

        {guardian === 'tanuki' && (
          <g stroke={`url(#${gradientId})`} strokeWidth="3.5" fill="none" strokeLinecap="round">
            {/* Round belly, leaf on the head, a coin in front */}
            <circle cx="60" cy="66" r="26" />
            <path d="M60 40c-6-10-2-18 4-22 2 8 0 16-4 22z" />
            <path d="M48 58h6M66 58h6" />
            <path d="M52 76c5 5 11 5 16 0" />
            <circle cx="60" cy="66" r="9" />
            <path d="M56 66h8" />
          </g>
        )}
      </g>
    </svg>
  );
}
