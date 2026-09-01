import type { Guardian, GuardianId } from '@/types';

/**
 * The three regulars. Serve one and it stays in the room for the round.
 *
 * The pick is a *presentation* choice: it changes colours, captions, particle
 * work and which cosmetic feature plays while the house is full.
 */
export const GUARDIANS: Guardian[] = [
  {
    id: 'kasa',
    name: 'Karakasa',
    title: 'The One-Eyed Umbrella',
    tagline: 'Hops in out of the rain',
    feature: 'Shelter — Expanding Wild',
    description:
      'It takes the corner table and shakes itself dry. Every coin that lands opens like a canopy across its whole reel, and the room fills with paper-lantern light.',
    colors: { primary: '#F8A65B', secondary: '#F8C65B', aura: 'rgba(248,166,91,0.55)' },
  },
  {
    id: 'kitsune',
    name: 'Yuzuha',
    title: 'The Fox in Borrowed Silk',
    tagline: 'Counts her tails when she thinks no one looks',
    feature: 'Foxfire — Mystery Cascade',
    description:
      'She pays in leaves that look like coin until morning. Foxfire drifts through the room and the sealed talismans fall far more often, all turning over together.',
    colors: { primary: '#6BE3C0', secondary: '#25D9FF', aura: 'rgba(107,227,192,0.55)' },
  },
  {
    id: 'tanuki',
    name: 'Bunzo',
    title: 'The Tanuki with the Empty Purse',
    tagline: 'Always good for it tomorrow',
    feature: 'Lucky Purse — Rising Multiplier',
    description:
      'He drums on his belly and the whole house keeps time. Every round he wins feeds the purse, and the multiplier climbs while the lamps burn a deeper red.',
    colors: { primary: '#FF4D6D', secondary: '#F8C65B', aura: 'rgba(255,77,109,0.5)' },
  },
];

export const GUARDIAN_MAP: Record<GuardianId, Guardian> = GUARDIANS.reduce((acc, g) => {
  acc[g.id] = g;
  return acc;
}, {} as Record<GuardianId, Guardian>);
