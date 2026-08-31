import type { RelicReward } from '@/types';

/** Names for the twelve sealed relics in the Pick a Relic mini-game. */
export const RELIC_NAMES = [
  'Ashen Bell',
  'Tide Sigil',
  'Ember Coil',
  'Moon Shard',
  'Iron Lotus',
  'Storm Ring',
  'Jade Key',
  'Sun Anchor',
  'Void Prism',
  'Frost Sigil',
  'Gold Feather',
  'Rune Lantern',
];

/**
 * Reward pool. `points` is a *virtual demo score* only — it is scaled by the
 * current demo stake when a relic is opened.
 */
export const RELIC_REWARDS: RelicReward[] = [
  {
    type: 'multiplier',
    label: '×3 Demo Multiplier',
    detail: 'The relic hums and triples the demo score of this hunt.',
    points: 3,
    color: '#F8C65B',
  },
  {
    type: 'multiplier',
    label: '×5 Demo Multiplier',
    detail: 'A rare seal — five times the demo score, and the room goes gold.',
    points: 5,
    color: '#FFE9AE',
  },
  {
    type: 'wildExpansion',
    label: 'Wild Expansion',
    detail: 'A Celestial Wild unfurls across a full reel in the next demo round.',
    points: 8,
    color: '#25D9FF',
  },
  {
    type: 'extraSpins',
    label: '+2 Free Spins',
    detail: 'Two extra demo free spins are added to the Guardians’ round.',
    points: 6,
    color: '#28D6A0',
  },
  {
    type: 'mysteryReveal',
    label: 'Mystery Reveal',
    detail: 'Every rune on the reels resolves into the same guardian symbol.',
    points: 7,
    color: '#8A4DFF',
  },
  {
    type: 'points',
    label: 'Relic Hoard',
    detail: 'A cache of temple tokens spills out as pure demo score.',
    points: 12,
    color: '#F8C65B',
  },
  {
    type: 'points',
    label: 'Temple Tribute',
    detail: 'A modest offering, still warm from the braziers.',
    points: 4,
    color: '#C9A6FF',
  },
  {
    type: 'points',
    label: 'Guardian Favour',
    detail: 'The sentries approve of your choice.',
    points: 9,
    color: '#FF4D6D',
  },
];
