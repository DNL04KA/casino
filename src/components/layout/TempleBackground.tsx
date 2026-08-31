import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { GuardianId } from '@/types';
import type { QualityTier } from '@/hooks/useQuality';
import { GUARDIAN_MAP } from '@/data/guardians';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ParticleCanvas } from '@/components/common/ParticleCanvas';

interface TempleBackgroundProps {
  /** When a Guardian is active the whole scene shifts to their palette. */
  guardian: GuardianId | null;
  dimmed?: boolean;
  quality: QualityTier;
}

const EMBER_COLORS = ['#F8C65B', '#FFE9AE', '#25D9FF', '#8A4DFF'];

/**
 * An occasional silent flash of lightning behind the ridges. Long, irregular
 * gaps keep it atmospheric instead of distracting.
 */
function StormFlash({ accent }: { accent: string }): JSX.Element {
  return (
    <motion.div
      className="absolute inset-x-0 top-0 h-[62%]"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0, 0.5, 0.1, 0.35, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 13, times: [0, 0.6, 0.66, 0.72, 0.78, 1] }}
      style={{
        background: `linear-gradient(180deg, ${accent}2E 0%, rgba(255,255,255,0.06) 32%, transparent 70%)`,
      }}
    >
      <svg viewBox="0 0 400 220" className="absolute left-[24%] top-[14%] h-[38%] w-[26%] opacity-80">
        <path
          d="M214 6 L168 92 L206 96 L152 214 L186 108 L148 104 Z"
          fill="#FFFFFF"
          opacity="0.85"
          style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))' }}
        />
      </svg>
    </motion.div>
  );
}

/**
 * The whole environment — night sky, moon, drifting cloud bank, the temple on
 * its cliff, a waterfall of light, fog and floating embers — built from SVG and
 * CSS gradients so it stays razor sharp at any resolution and costs no assets.
 */
export function TempleBackground({
  guardian,
  dimmed = false,
  quality,
}: TempleBackgroundProps): JSX.Element {
  const reduceMotion = useReducedMotion();

  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 62,
        r: Math.random() * 1.3 + 0.3,
        o: Math.random() * 0.7 + 0.2,
      })),
    [],
  );

  const accent = guardian ? GUARDIAN_MAP[guardian].colors.primary : '#25D9FF';
  const accentSoft = guardian ? GUARDIAN_MAP[guardian].colors.aura : 'rgba(37,217,255,0.45)';

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden transition-opacity duration-700"
      style={{ opacity: dimmed ? 0.35 : 1 }}
      aria-hidden="true"
    >
      {/* Sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, #241a52 0%, #130b2c 38%, #08111f 72%, #050a14 100%)',
        }}
      />

      {/* Stars */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {stars.map((star, i) => (
          <circle key={i} cx={star.x} cy={star.y} r={star.r * 0.12} fill="#E8F4FF" opacity={star.o} />
        ))}
      </svg>

      {/* Moon */}
      <div
        className="absolute left-1/2 top-[6%] h-[22vmin] w-[22vmin] -translate-x-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle at 38% 34%, #FFFFFF 0%, #E7DFFF 38%, #A08BE0 66%, #4B3A86 100%)',
          boxShadow: `0 0 80px 24px ${accentSoft}, 0 0 220px 80px rgba(138,77,255,0.28)`,
          animation: reduceMotion ? undefined : 'moonBreath 9s ease-in-out infinite',
        }}
      />
      {/* Moon craters */}
      <svg
        className="absolute left-1/2 top-[6%] h-[22vmin] w-[22vmin] -translate-x-1/2 opacity-30"
        viewBox="0 0 100 100"
      >
        <circle cx="38" cy="42" r="7" fill="#6B5AA8" />
        <circle cx="60" cy="34" r="4" fill="#6B5AA8" />
        <circle cx="56" cy="62" r="9" fill="#6B5AA8" opacity="0.7" />
        <circle cx="32" cy="66" r="3.4" fill="#6B5AA8" />
      </svg>

      {/* Waterfall of light behind the temple */}
      <div
        className="absolute left-1/2 top-[14%] h-[62%] w-[26vmin] -translate-x-1/2"
        style={{
          background: `radial-gradient(50% 60% at 50% 0%, ${accentSoft} 0%, rgba(37,217,255,0.10) 45%, rgba(37,217,255,0) 100%)`,
          maskImage:
            'radial-gradient(60% 100% at 50% 10%, #000 0%, rgba(0,0,0,0.55) 55%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(60% 100% at 50% 10%, #000 0%, rgba(0,0,0,0.55) 55%, transparent 100%)',
        }}
      />

      {/* Cloud bank — soft radial gradients, so no blur filter is needed */}
      <div
        data-ambient
        className="absolute inset-x-0 top-[18%] h-[36%] opacity-60"
        style={{
          animation: reduceMotion ? undefined : 'drift-clouds 64s ease-in-out infinite alternate',
          willChange: reduceMotion ? undefined : 'transform',
        }}
      >
        {[
          { left: '4%', width: '46%', top: '18%', height: '58%', alpha: 0.5 },
          { left: '38%', width: '54%', top: '42%', height: '52%', alpha: 0.42 },
          { left: '68%', width: '44%', top: '10%', height: '60%', alpha: 0.46 },
        ].map((cloud, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: cloud.left,
              width: cloud.width,
              top: cloud.top,
              height: cloud.height,
              background: `radial-gradient(closest-side, rgba(92,75,158,${cloud.alpha}) 0%, rgba(60,46,110,${cloud.alpha * 0.5}) 45%, rgba(27,17,64,0) 100%)`,
            }}
          />
        ))}
      </div>

      {/* Cliff + temple silhouette */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[72%] w-full"
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="cliff" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A2542" />
            <stop offset="55%" stopColor="#0C1428" />
            <stop offset="100%" stopColor="#060B16" />
          </linearGradient>
          <linearGradient id="templeBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A3A63" />
            <stop offset="100%" stopColor="#101A32" />
          </linearGradient>
          <linearGradient id="roof" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3C2E6B" />
            <stop offset="100%" stopColor="#161033" />
          </linearGradient>
        </defs>

        {/* Far ridges */}
        <path d="M0 300 L160 236 L300 292 L430 240 L560 300 L700 246 L860 306 L1010 250 L1200 312 L1200 560 L0 560Z" fill="#131C36" opacity="0.75" />

        {/* Temple */}
        <g transform="translate(600 96)">
          {/* Tiers */}
          {[0, 1, 2].map((tier) => {
            const width = 240 - tier * 56;
            const y = tier * 62;
            return (
              <g key={tier}>
                <path
                  d={`M${-width / 2 - 26} ${y + 22} Q0 ${y - 18} ${width / 2 + 26} ${y + 22} L${width / 2} ${y + 30} L${-width / 2} ${y + 30} Z`}
                  fill="url(#roof)"
                  stroke={accent}
                  strokeOpacity="0.35"
                  strokeWidth="1.2"
                />
                <rect x={-width / 2 + 8} y={y + 30} width={width - 16} height={34} fill="url(#templeBody)" />
                {[0, 1, 2].map((w) => (
                  <rect
                    key={w}
                    x={-width / 2 + 24 + w * ((width - 60) / 2.4)}
                    y={y + 38}
                    width="14"
                    height="18"
                    rx="3"
                    fill={accent}
                    opacity="0.7"
                  />
                ))}
              </g>
            );
          })}
          {/* Spire */}
          <path d="M0 -34 L8 -6 L-8 -6 Z" fill="#F8C65B" opacity="0.9" />
          <circle cx="0" cy="-42" r="5" fill="#FFE9AE" />
        </g>

        {/* Cliff face */}
        <path
          d="M0 380 L120 348 L250 392 L360 340 L470 372 L600 318 L740 366 L860 330 L980 378 L1100 342 L1200 386 L1200 560 L0 560Z"
          fill="url(#cliff)"
        />

        {/* Stair light */}
        <path d="M580 300 L620 300 L660 560 L540 560 Z" fill={accent} opacity="0.07" />
      </svg>

      {/* Fog banks */}
      {[0, 1, 2].map((layer) => (
        <div
          key={layer}
          data-ambient
          className="absolute inset-x-[-20%] h-[26vh]"
          style={{
            bottom: `${layer * 9}%`,
            background: `radial-gradient(60% 100% at 50% 60%, rgba(150,180,255,${0.18 - layer * 0.045}) 0%, rgba(150,180,255,0) 70%)`,
            animation: reduceMotion ? undefined : `fogDrift ${28 + layer * 11}s ease-in-out ${layer * 3}s infinite alternate`,
            willChange: reduceMotion ? undefined : 'transform, opacity',
          }}
        />
      ))}

      {/* Ambient embers — a single canvas rather than one node per mote */}
      {quality !== 'saver' && (
        <ParticleCanvas
          mode="ambient"
          colors={EMBER_COLORS}
          count={quality === 'high' ? 54 : 24}
          additive={quality === 'high'}
          maxDpr={quality === 'high' ? 1.5 : 1}
        />
      )}

      {/* Distant storm over the valley */}
      {!reduceMotion && quality === 'high' && <StormFlash accent={accent} />}

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.85) 100%)',
        }}
      />
    </div>
  );
}
