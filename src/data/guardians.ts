import type { Guardian, GuardianId } from '@/types';

/**
 * The three Guardians. The pick is a *presentation* choice: it changes colours,
 * captions, particle work and which cosmetic feature animates during the demo
 * free-spins round.
 */
export const GUARDIANS: Guardian[] = [
  {
    id: 'dragon',
    name: 'Vireth',
    title: 'Dragon Guardian',
    tagline: 'Cold fire, gold scales',
    feature: 'Expanding Celestial Wild',
    description:
      'Every amulet that lands grows to fill its whole reel in a wash of blue-gold flame. Wide, sweeping wins and long ribbons of light.',
    colors: { primary: '#25D9FF', secondary: '#F8C65B', aura: 'rgba(37,217,255,0.55)' },
  },
  {
    id: 'tiger',
    name: 'Kaoren',
    title: 'Tiger Guardian',
    tagline: 'Every strike counts twice',
    feature: 'Rising Demo Multiplier',
    description:
      'Each winning free spin feeds the ember gauge. The visual multiplier climbs with every hit and repaints the reels in molten red.',
    colors: { primary: '#FF4D6D', secondary: '#F8C65B', aura: 'rgba(255,77,109,0.5)' },
  },
  {
    id: 'moon',
    name: 'Suyen',
    title: 'Moon Guardian',
    tagline: 'The runes answer to her',
    feature: 'Mystery Rune Cascade',
    description:
      'Moonlight floods the temple and mystery runes fall far more often, all transforming together into a single guardian symbol.',
    colors: { primary: '#8A4DFF', secondary: '#C9A6FF', aura: 'rgba(138,77,255,0.55)' },
  },
];

export const GUARDIAN_MAP: Record<GuardianId, Guardian> = GUARDIANS.reduce((acc, g) => {
  acc[g.id] = g;
  return acc;
}, {} as Record<GuardianId, Guardian>);
