/**
 * Global demo tuning. All values are cosmetic / presentational.
 */

export const GRID_COLUMNS = 5;
export const GRID_ROWS = 3;

/** Virtual starting balance shown as "Demo Credits". */
export const STARTING_CREDITS = 10_000;

/** Selectable demo stake steps (virtual points per spin). */
export const BET_STEPS = [10, 20, 40, 60, 100, 150, 250, 400, 600, 1000] as const;
export const DEFAULT_BET_INDEX = 2;

/** Auto-spin is capped hard at ten consecutive demo rounds. */
export const AUTO_SPIN_MAX = 10;

/** Free rounds awarded when the doorway opens. */
export const FREE_SPINS_AWARD = 10;

/** Relic hunt configuration. */
export const RELIC_CARD_COUNT = 12;
export const RELIC_PICKS = 3;

/** How far the Tanuki's lucky purse can climb during the midnight service. */
export const PURSE_MULTIPLIER_CAP = 4;

/** Noren curtains needed before the doorway opens. */
export const SCATTERS_FOR_BONUS = 3;

/** Win tier thresholds expressed as multiples of the current demo stake. */
export const WIN_TIERS = {
  small: 0.01,
  nice: 3,
  big: 12,
  mega: 30,
  epic: 70,
} as const;

/** Animation timings in milliseconds — normal vs. turbo presentation. */
export const TIMING = {
  normal: {
    reelSpinUp: 260,
    firstReelStop: 900,
    reelStopStep: 190,
    anticipationExtra: 900,
    mysteryReveal: 1250,
    expandWild: 900,
    winCycle: 1100,
    countUpPerTier: { none: 0, small: 700, nice: 900, big: 2000, mega: 2800, epic: 3600 },
    bigWinHold: 2600,
    betweenAutoSpins: 700,
  },
  turbo: {
    reelSpinUp: 90,
    firstReelStop: 260,
    reelStopStep: 60,
    anticipationExtra: 320,
    mysteryReveal: 520,
    expandWild: 380,
    winCycle: 480,
    countUpPerTier: { none: 0, small: 260, nice: 340, big: 800, mega: 1000, epic: 1300 },
    bigWinHold: 1100,
    betweenAutoSpins: 220,
  },
} as const;

export type TimingProfile = (typeof TIMING)['normal'];

export const DEMO_DISCLAIMER =
  'This is a non-monetary visual prototype. No real-money gambling, deposits, withdrawals, or prizes.';
