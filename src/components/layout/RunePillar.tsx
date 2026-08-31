import type { GuardianId } from '@/types';
import { GUARDIAN_MAP } from '@/data/guardians';
import { GuardianColossus } from '@/components/layout/GuardianColossus';

interface RunePillarProps {
  side: 'left' | 'right';
  guardian: GuardianId | null;
  /** Celebrations wake the colossus standing in front of the pillar. */
  excited?: boolean;
  /**
   * How many runes are lit. Driven by the tumble chain, so the cabinet itself
   * charges up as a round keeps paying.
   */
  energy?: number;
}

const RUNES = ['ᛟ', 'ᛉ', 'ᚦ', 'ᛗ', 'ᛊ', 'ᛃ'];

/** Carved stone column flanking the reels, inlaid with slowly pulsing runes. */
export function RunePillar({
  side,
  guardian,
  excited = false,
  energy = 0,
}: RunePillarProps): JSX.Element {
  const accent = guardian ? GUARDIAN_MAP[guardian].colors.primary : '#25D9FF';
  const flip = side === 'right' ? 'scaleX(-1)' : undefined;

  return (
    <div
      className="relative hidden h-full w-[124px] shrink-0 lg:block xl:w-[176px] 2xl:w-[212px]"
      style={{ transform: flip }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 620"
        preserveAspectRatio="none"
        className="absolute inset-y-0 left-1/2 h-full w-[74px] -translate-x-1/2 opacity-90 xl:w-[88px]"
      >
        <defs>
          <linearGradient id={`stone-${side}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0D1526" />
            <stop offset="30%" stopColor="#243255" />
            <stop offset="62%" stopColor="#16203A" />
            <stop offset="100%" stopColor="#080D1A" />
          </linearGradient>
          <linearGradient id={`cap-${side}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A2E6B" />
            <stop offset="100%" stopColor="#141C33" />
          </linearGradient>
        </defs>

        {/* Capital */}
        <path d="M4 10 L96 10 L88 44 L12 44 Z" fill={`url(#cap-${side})`} stroke="#F8C65B" strokeOpacity="0.35" />
        {/* Shaft */}
        <rect x="14" y="44" width="72" height="520" fill={`url(#stone-${side})`} />
        {/* Base */}
        <path d="M8 564 L92 564 L98 610 L2 610 Z" fill={`url(#cap-${side})`} stroke="#F8C65B" strokeOpacity="0.35" />

        {/* Fluting */}
        {[26, 42, 58, 74].map((x) => (
          <line key={x} x1={x} y1="52" x2={x} y2="556" stroke="#000" strokeOpacity="0.35" strokeWidth="2" />
        ))}

        {/* Gold banding */}
        {[120, 300, 480].map((y) => (
          <rect key={y} x="10" y={y} width="80" height="10" fill="#1A2340" stroke="#F8C65B" strokeOpacity="0.45" />
        ))}

        {/* Rune sockets — they ignite from the base up as the chain grows */}
        {RUNES.map((rune, i) => {
          const lit = i < energy;
          const cy = 92 + (RUNES.length - 1 - i) * 86;
          return (
            <g key={rune} style={{ color: accent }}>
              {lit && <circle cx="50" cy={cy} r="26" fill={accent} opacity="0.22" />}
              <circle
                cx="50"
                cy={cy}
                r="17"
                fill={lit ? accent : '#060B16'}
                fillOpacity={lit ? 0.35 : 1}
                stroke={accent}
                strokeOpacity={lit ? 1 : 0.5}
                strokeWidth={lit ? 2.4 : 1.4}
              />
              <text
                x="50"
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="20"
                fill={lit ? '#FFFFFF' : accent}
                opacity={lit ? 1 : undefined}
                style={
                  lit
                    ? undefined
                    : { animation: `runePulse ${4 + i * 0.7}s ease-in-out ${i * 0.4}s infinite` }
                }
              >
                {rune}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Column edge light */}
      <div
        className="absolute inset-y-0 right-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, transparent, ${accent}, transparent)`, opacity: 0.5 }}
      />

      <GuardianColossus side={side} guardian={guardian} excited={excited} />
    </div>
  );
}
