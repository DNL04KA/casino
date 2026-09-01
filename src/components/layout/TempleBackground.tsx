import { motion } from 'framer-motion';
import type { GuardianId } from '@/types';
import type { QualityTier } from '@/hooks/useQuality';
import { GUARDIAN_MAP } from '@/data/guardians';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ParticleCanvas } from '@/components/common/ParticleCanvas';
import teaHouse from '@/assets/tea-house.jpg';
import teaHouseBonus from '@/assets/tea-house-bonus.jpg';

interface TempleBackgroundProps {
  /** When a Guardian is active the whole scene shifts to their palette. */
  guardian: GuardianId | null;
  dimmed?: boolean;
  quality: QualityTier;
  /** 0–1: how charged the round is. Brightens the lanterns. */
  charge?: number;
  /** The midnight service swaps the room for its crowded version. */
  bonus?: boolean;
}

const EMBER_COLORS = ['#F8C65B', '#FFE9AE', '#25D9FF', '#8A4DFF'];

/**
 * The painted temple hall the whole game sits inside.
 *
 * This replaced a procedurally drawn scene. Vector geometry is excellent at
 * ornament and hopeless at painted depth, and the earlier version read as
 * stacked layers rather than a place. One illustrated hall — with its own
 * perspective, light and atmosphere — does what no amount of stacked gradients
 * could: it gives the reels somewhere to be.
 *
 * Everything still moving on top of it is procedural: embers, the guardian
 * colour wash, and the orb that answers the round.
 */
export function TempleBackground({
  guardian,
  dimmed = false,
  quality,
  charge = 0,
  bonus = false,
}: TempleBackgroundProps): JSX.Element {
  const reduceMotion = useReducedMotion();
  const accent = guardian ? GUARDIAN_MAP[guardian].colors.primary : '#25D9FF';

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden transition-opacity duration-700"
      style={{ opacity: dimmed ? 0.4 : 1 }}
      aria-hidden="true"
    >
      {/* Both rooms stay mounted so the swap is a cross-fade, not a reload */}
      <img
        src={teaHouse}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
        style={{ objectPosition: '50% 50%', opacity: bonus ? 0 : 1 }}
        draggable={false}
      />
      <img
        src={teaHouseBonus}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
        style={{ objectPosition: '50% 50%', opacity: bonus ? 1 : 0 }}
        draggable={false}
      />

      {/* Guardian colour wash — the hall takes on the chosen ally's light */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: guardian
            ? `radial-gradient(120% 90% at 50% 40%, ${accent}22 0%, transparent 62%)`
            : 'transparent',
          mixBlendMode: 'screen',
        }}
      />

      {/* The room's lanterns swell as the round charges */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: '50%',
          top: '26%',
          width: '46vmax',
          height: '22vmax',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${accent}CC 0%, ${accent}44 38%, transparent 70%)`,
          mixBlendMode: 'screen',
        }}
        animate={
          reduceMotion
            ? { opacity: 0.35 }
            : { opacity: [0.25 + charge * 0.5, 0.5 + charge * 0.5, 0.25 + charge * 0.5] }
        }
        transition={{ duration: charge > 0.3 ? 1.1 : 4.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ambient embers — a single canvas rather than one node per mote */}
      {quality !== 'saver' && (
        <ParticleCanvas
          mode="ambient"
          colors={EMBER_COLORS}
          count={quality === 'high' ? 44 : 20}
          additive={quality === 'high'}
          maxDpr={quality === 'high' ? 1.5 : 1}
        />
      )}

      {/* Vignette keeps the eye on the board */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(115% 88% at 50% 46%, rgba(0,0,0,0) 34%, rgba(3,6,14,0.5) 74%, rgba(2,4,10,0.86) 100%)',
        }}
      />
    </div>
  );
}
