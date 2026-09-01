import { GRID_COLUMNS, GRID_ROWS, SCATTERS_FOR_BONUS, WIN_TIERS } from '@/data/config';
import { PAYLINES } from '@/data/paylines';
import { getSymbol, HIGH_SYMBOLS } from '@/data/symbols';
import type {
  Cell,
  Grid,
  LineWin,
  OrbDrop,
  SpinMode,
  SpinOutcome,
  SymbolId,
  TumbleStep,
  WinTier,
} from '@/types';
import { chance, defaultRandom, pick, randomInt, weightedPick, type RandomFn } from './rng';

/* -------------------------------------------------------------------------- */
/*  Reel composition                                                          */
/* -------------------------------------------------------------------------- */

type WeightMap = Record<SymbolId, number>;

const BASE_WEIGHT: WeightMap = {
  kasa: 6,
  kitsune: 7,
  okami: 8,
  tanuki: 9,
  teapot: 16,
  cup: 17,
  lantern: 18,
  fan: 19,
  incense: 20,
  wild: 3,
  scatter: 3,
  mystery: 2,
};

function makeWeights(overrides: Partial<WeightMap>): WeightMap {
  return { ...BASE_WEIGHT, ...overrides };
}

/** Per-reel weighting keeps reel 1 tame and the middle reels rich. */
const REEL_WEIGHTS: WeightMap[] = [
  makeWeights({ wild: 1, scatter: 3, mystery: 1.6 }),
  makeWeights({ wild: 4, scatter: 3, mystery: 2.4 }),
  makeWeights({ wild: 5, scatter: 3, mystery: 3, kasa: 7 }),
  makeWeights({ wild: 4, scatter: 3, mystery: 2.4 }),
  makeWeights({ wild: 1, scatter: 3, mystery: 1.6 }),
];

const PAYABLE: SymbolId[] = [
  'kasa',
  'kitsune',
  'okami',
  'tanuki',
  'teapot',
  'cup',
  'lantern',
  'fan',
  'incense',
  'wild',
];

function isPayable(id: SymbolId): boolean {
  return PAYABLE.includes(id);
}

/* -------------------------------------------------------------------------- */
/*  Presentation director                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A slot built for a portfolio needs to *show its features*. The director
 * occasionally scripts a spin so a reviewer sees the bonus, a near-miss and a
 * big-win celebration within a short session.
 *
 * This is explicitly a demo-pacing device, not a payout model: there is no
 * RTP, no house edge and nothing of value at stake.
 */
type DemoScript =
  | 'natural'
  | 'seedWin'
  | 'bigWin'
  | 'hugeWin'
  | 'nearMiss'
  | 'bonus'
  | 'mysteryCluster';

interface DirectorInput {
  mode: SpinMode;
  spinIndex: number;
  spinsSinceBonus: number;
  rng: RandomFn;
}

function rollScript({ mode, spinsSinceBonus, rng }: DirectorInput): DemoScript {
  if (mode.kind === 'free') {
    // Free spins should feel generous and busy.
    if (chance(0.16, rng)) return 'hugeWin';
    if (chance(0.34, rng)) return 'bigWin';
    if (chance(0.3, rng)) return 'mysteryCluster';
    return 'seedWin';
  }

  // Guarantee the reviewer reaches the bonus round in a reasonable time.
  if (spinsSinceBonus >= 45) return 'bonus';
  if (chance(0.025, rng)) return 'bonus';
  if (chance(0.022, rng)) return 'hugeWin';
  if (chance(0.055, rng)) return 'bigWin';
  if (chance(0.09, rng)) return 'nearMiss';
  if (chance(0.045, rng)) return 'mysteryCluster';
  if (chance(0.36, rng)) return 'seedWin';
  return 'natural';
}

/* -------------------------------------------------------------------------- */
/*  Grid building                                                             */
/* -------------------------------------------------------------------------- */

function emptyGrid(): Grid {
  return Array.from({ length: GRID_COLUMNS }, () => Array.from({ length: GRID_ROWS }, () => 'incense' as SymbolId));
}

interface GridOptions {
  rng: RandomFn;
  mysteryBoost: number;
  allowScatter: boolean;
}

function randomGrid({ rng, mysteryBoost, allowScatter }: GridOptions): Grid {
  const grid = emptyGrid();
  for (let reel = 0; reel < GRID_COLUMNS; reel += 1) {
    const weights: WeightMap = { ...(REEL_WEIGHTS[reel] as WeightMap) };
    weights.mystery *= mysteryBoost;
    if (!allowScatter) weights.scatter = 0;
    let scatterPlaced = false;
    for (let row = 0; row < GRID_ROWS; row += 1) {
      const local: WeightMap = { ...weights };
      // At most one Temple Gate per reel — keeps the trigger readable.
      if (scatterPlaced) local.scatter = 0;
      const symbol = weightedPick(local, rng);
      if (symbol === 'scatter') scatterPlaced = true;
      grid[reel][row] = symbol;
    }
  }
  return grid;
}

function stripScatters(grid: Grid, fromReel: number, rng: RandomFn): void {
  for (let reel = fromReel; reel < GRID_COLUMNS; reel += 1) {
    for (let row = 0; row < GRID_ROWS; row += 1) {
      if (grid[reel][row] === 'scatter') {
        grid[reel][row] = pick(['teapot', 'cup', 'lantern', 'fan', 'incense'] as SymbolId[], rng);
      }
    }
  }
}

function countSymbol(grid: Grid, id: SymbolId): number {
  let total = 0;
  for (let reel = 0; reel < GRID_COLUMNS; reel += 1) {
    for (let row = 0; row < GRID_ROWS; row += 1) {
      if (grid[reel][row] === id) total += 1;
    }
  }
  return total;
}

function findCells(grid: Grid, id: SymbolId): Cell[] {
  const cells: Cell[] = [];
  for (let reel = 0; reel < GRID_COLUMNS; reel += 1) {
    for (let row = 0; row < GRID_ROWS; row += 1) {
      if (grid[reel][row] === id) cells.push([reel, row] as Cell);
    }
  }
  return cells;
}

/** Writes a run of `count` matching symbols along a random payline. */
function paintLine(grid: Grid, symbol: SymbolId, count: number, rng: RandomFn, wildChance = 0.18): void {
  const line = pick(PAYLINES, rng);
  for (let reel = 0; reel < count; reel += 1) {
    const row = line.rows[reel];
    grid[reel][row] = reel > 0 && chance(wildChance, rng) ? 'wild' : symbol;
  }
  // Break the run right after it so the win reads cleanly.
  if (count < GRID_COLUMNS) {
    const breakRow = line.rows[count];
    const filler = pick(['incense', 'fan', 'lantern'] as SymbolId[], rng);
    if (grid[count][breakRow] === symbol || grid[count][breakRow] === 'wild') {
      grid[count][breakRow] = filler;
    }
  }
}

function scatterOnReels(grid: Grid, reels: number[], rng: RandomFn): void {
  for (const reel of reels) {
    grid[reel][randomInt(GRID_ROWS, rng)] = 'scatter';
  }
}

function sprinkleMystery(grid: Grid, amount: number, rng: RandomFn): void {
  let placed = 0;
  let guard = 0;
  while (placed < amount && guard < 80) {
    guard += 1;
    const reel = randomInt(GRID_COLUMNS, rng);
    const row = randomInt(GRID_ROWS, rng);
    if (grid[reel][row] === 'scatter' || grid[reel][row] === 'mystery') continue;
    grid[reel][row] = 'mystery';
    placed += 1;
  }
}

/* -------------------------------------------------------------------------- */
/*  Evaluation                                                                */
/* -------------------------------------------------------------------------- */

function payFor(symbol: SymbolId, count: number): number {
  if (count < 3) return 0;
  const def = getSymbol(symbol);
  return def.pays[count as 3 | 4 | 5] ?? 0;
}

function evaluateLines(grid: Grid, bet: number, multiplier: number): LineWin[] {
  const wins: LineWin[] = [];

  for (const line of PAYLINES) {
    const cells = line.rows.map((row, reel) => grid[reel][row] as SymbolId);
    const first = cells[0] as SymbolId;
    if (first === 'scatter' || first === 'mystery') continue;

    const candidates: SymbolId[] = [];
    if (first === 'wild') {
      candidates.push('wild');
      for (const symbol of PAYABLE) {
        if (symbol !== 'wild' && cells.includes(symbol)) candidates.push(symbol);
      }
    } else if (isPayable(first)) {
      candidates.push(first);
    }

    let best: LineWin | null = null;
    for (const candidate of candidates) {
      let count = 0;
      for (let reel = 0; reel < GRID_COLUMNS; reel += 1) {
        const value = cells[reel] as SymbolId;
        const matches = candidate === 'wild' ? value === 'wild' : value === candidate || value === 'wild';
        if (!matches) break;
        count += 1;
      }
      const amount = payFor(candidate, count) * bet * multiplier;
      if (amount <= 0) continue;
      if (!best || amount > best.amount) {
        best = {
          lineId: line.id,
          lineName: line.name,
          symbol: candidate,
          count,
          cells: line.rows.slice(0, count).map((row, reel) => [reel, row] as Cell),
          amount,
          multiplier,
        };
      }
    }

    if (best) wins.push(best);
  }

  return wins.sort((a, b) => b.amount - a.amount);
}

function evaluateScatter(grid: Grid, bet: number, multiplier: number): LineWin | null {
  const cells = findCells(grid, 'scatter');
  if (cells.length < SCATTERS_FOR_BONUS) return null;
  const count = Math.min(cells.length, 5) as 3 | 4 | 5;
  const amount = getSymbol('scatter').pays[count] * bet * multiplier;
  return {
    lineId: 0,
    lineName: 'Temple Gate',
    symbol: 'scatter',
    count: cells.length,
    cells,
    amount,
    multiplier,
  };
}

export function tierFor(totalWin: number, bet: number): WinTier {
  if (totalWin <= 0 || bet <= 0) return 'none';
  const ratio = totalWin / bet;
  if (ratio >= WIN_TIERS.epic) return 'epic';
  if (ratio >= WIN_TIERS.mega) return 'mega';
  if (ratio >= WIN_TIERS.big) return 'big';
  if (ratio >= WIN_TIERS.nice) return 'nice';
  return 'small';
}

export const TIER_LABEL: Record<WinTier, string> = {
  none: '',
  small: 'Demo Win',
  nice: 'Nice Win',
  big: 'BIG WIN',
  mega: 'MEGA WIN',
  epic: 'EPIC WIN',
};

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

export interface SpinRequest {
  bet: number;
  mode: SpinMode;
  spinIndex: number;
  spinsSinceBonus: number;
  /** Relic rewards can pre-arm the next demo spin. */
  forceWildExpansion?: boolean;
  forceMysteryCluster?: boolean;
  rng?: RandomFn;
}

/* -------------------------------------------------------------------------- */
/*  Tumbles                                                                   */
/* -------------------------------------------------------------------------- */

/** Refills never carry scatters or runes, so the trigger stays on the first drop. */
const REFILL_WEIGHTS: WeightMap = makeWeights({ wild: 2, scatter: 0, mystery: 0 });

function refillSymbol(rng: RandomFn): SymbolId {
  return weightedPick(REFILL_WEIGHTS, rng);
}

/** Winning symbols shatter; survivors fall to the floor and the gaps refill. */
function dropAndRefill(grid: Grid, cleared: Cell[], rng: RandomFn): Grid {
  const clearedByReel = new Map<number, Set<number>>();
  for (const [reel, row] of cleared) {
    const rows = clearedByReel.get(reel) ?? new Set<number>();
    rows.add(row);
    clearedByReel.set(reel, rows);
  }

  const next: Grid = [];
  for (let reel = 0; reel < GRID_COLUMNS; reel += 1) {
    const rows = clearedByReel.get(reel);
    if (!rows || rows.size === 0) {
      next.push(grid[reel].slice());
      continue;
    }
    const survivors = grid[reel].filter((_, row) => !rows.has(row));
    const incoming = Array.from({ length: GRID_ROWS - survivors.length }, () => refillSymbol(rng));
    next.push([...incoming, ...survivors]);
  }
  return next;
}

function uniqueCells(wins: LineWin[]): Cell[] {
  const seen = new Set<string>();
  const cells: Cell[] = [];
  for (const win of wins) {
    for (const cell of win.cells) {
      const key = `${cell[0]}:${cell[1]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push(cell);
    }
  }
  return cells;
}

/* -------------------------------------------------------------------------- */
/*  Rune Orbs                                                                 */
/* -------------------------------------------------------------------------- */

/** Orb face values and how often each shows up. Presentation values only. */
const ORB_TABLE: { value: number; weight: number }[] = [
  { value: 2, weight: 34 },
  { value: 3, weight: 26 },
  { value: 5, weight: 18 },
  { value: 8, weight: 10 },
  { value: 10, weight: 6 },
  { value: 15, weight: 3 },
  { value: 20, weight: 1.6 },
  { value: 25, weight: 0.8 },
  { value: 50, weight: 0.3 },
  { value: 100, weight: 0.1 },
  { value: 250, weight: 0.02 },
  { value: 500, weight: 0.005 },
];

/** The orb ladder, richest last — rendered in the paytable. */
export const ORB_VALUES: number[] = ORB_TABLE.map((entry) => entry.value);

function rollOrbValue(rng: RandomFn): number {
  let total = 0;
  for (const entry of ORB_TABLE) total += entry.weight;
  let roll = rng() * total;
  for (const entry of ORB_TABLE) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return 2;
}

interface OrbPlan {
  orbs: OrbDrop[];
  multiplier: number;
}

function planOrbs(steps: number, mode: SpinMode, rng: RandomFn): OrbPlan {
  // Orbs are a universal feature — the Tiger's edge is its rising multiplier,
  // so it does not also get richer orbs.
  const chance = mode.kind === 'free' ? 0.45 : 0.3;
  if (rng() > chance) return { orbs: [], multiplier: 0 };

  const maxOrbs = 3;
  const count = 1 + randomInt(maxOrbs, rng);
  const taken = new Set<string>();
  const orbs: OrbDrop[] = [];

  for (let i = 0; i < count; i += 1) {
    let cell: Cell | null = null;
    for (let attempt = 0; attempt < 12 && !cell; attempt += 1) {
      const candidate: Cell = [randomInt(GRID_COLUMNS, rng), randomInt(GRID_ROWS, rng)];
      const key = `${candidate[0]}:${candidate[1]}`;
      if (taken.has(key)) continue;
      taken.add(key);
      cell = candidate;
    }
    if (!cell) break;
    orbs.push({
      id: `orb-${i}-${Math.floor(rng() * 1e6).toString(36)}`,
      cell,
      value: rollOrbValue(rng),
      step: randomInt(Math.max(1, steps), rng),
    });
  }

  const multiplier = orbs.reduce((sum, orb) => sum + orb.value, 0);
  return { orbs, multiplier };
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/** Hard stop on the tumble chain so a demo round always ends. */
const MAX_TUMBLES = 8;

export function generateSpin(request: SpinRequest): SpinOutcome {
  const rng = request.rng ?? defaultRandom;
  const { bet, mode } = request;
  const guardian = mode.kind === 'free' ? mode.guardian : null;
  const multiplier = mode.kind === 'free' ? Math.max(1, mode.multiplier) : 1;

  const script = rollScript({
    mode,
    spinIndex: request.spinIndex,
    spinsSinceBonus: request.spinsSinceBonus,
    rng,
  });

  const wantsBonus = script === 'bonus' && mode.kind === 'base';
  const mysteryBoost =
    (guardian === 'kitsune' ? 3.2 : 1) *
    (script === 'mysteryCluster' || request.forceMysteryCluster ? 2.4 : 1);

  const landedGrid = randomGrid({
    rng,
    mysteryBoost,
    allowScatter: mode.kind === 'base',
  });

  switch (script) {
    case 'seedWin':
      paintLine(landedGrid, pick(['teapot', 'cup', 'lantern', 'fan', 'incense'] as SymbolId[], rng), 3, rng, 0.1);
      break;
    case 'bigWin':
      paintLine(landedGrid, pick(HIGH_SYMBOLS, rng), 4, rng, 0.25);
      break;
    case 'hugeWin':
      paintLine(landedGrid, pick(HIGH_SYMBOLS, rng), 5, rng, 0.3);
      if (chance(0.5, rng)) paintLine(landedGrid, pick(HIGH_SYMBOLS, rng), 4, rng, 0.2);
      break;
    case 'mysteryCluster':
      sprinkleMystery(landedGrid, 3 + randomInt(3, rng), rng);
      break;
    default:
      break;
  }

  if (mode.kind === 'base') {
    if (wantsBonus) {
      stripScatters(landedGrid, 0, rng);
      const reels = chance(0.2, rng) ? [0, 1, 2, 3] : [0, 1, 2];
      if (chance(0.06, rng)) reels.push(4);
      scatterOnReels(landedGrid, reels, rng);
    } else if (script === 'nearMiss') {
      stripScatters(landedGrid, 0, rng);
      scatterOnReels(landedGrid, [0, 1], rng);
    } else if (countSymbol(landedGrid, 'scatter') >= SCATTERS_FOR_BONUS) {
      // Only the director opens the gate, so trigger pacing stays readable.
      stripScatters(landedGrid, 2, rng);
    }
  }

  if (request.forceMysteryCluster) sprinkleMystery(landedGrid, 3, rng);
  if (request.forceWildExpansion) {
    const reel = 1 + randomInt(3, rng);
    landedGrid[reel][randomInt(GRID_ROWS, rng)] = 'wild';
  }

  /* ---- resolve mystery runes -------------------------------------------- */
  const mysteryCells = findCells(landedGrid, 'mystery');
  const openingGrid: Grid = landedGrid.map((reel) => reel.slice());
  let mysteryReveal: SymbolId | null = null;

  if (mysteryCells.length > 0) {
    mysteryReveal = weightedPick(
      { kasa: 2, kitsune: 3, okami: 3.5, tanuki: 4 } as Record<SymbolId, number>,
      rng,
    );
    for (const [reel, row] of mysteryCells) openingGrid[reel][row] = mysteryReveal;
  }

  /* ---- expanding wild (Dragon Guardian) --------------------------------- */
  const expandedReels: number[] = [];
  const expansionActive = guardian === 'kasa' || request.forceWildExpansion === true;
  if (expansionActive) {
    for (let reel = 0; reel < GRID_COLUMNS; reel += 1) {
      if (openingGrid[reel].includes('wild')) {
        expandedReels.push(reel);
        for (let row = 0; row < GRID_ROWS; row += 1) openingGrid[reel][row] = 'wild';
      }
    }
  }

  /* ---- tumble chain ------------------------------------------------------ */
  const scatterCells = findCells(openingGrid, 'scatter');
  const scatterCount = scatterCells.length;
  const scatterWin = evaluateScatter(openingGrid, bet, multiplier);

  const steps: TumbleStep[] = [];
  let board: Grid = openingGrid.map((reel) => reel.slice());

  for (let index = 0; index < MAX_TUMBLES; index += 1) {
    const lineWins = evaluateLines(board, bet, multiplier);
    const wins = index === 0 && scatterWin ? [scatterWin, ...lineWins] : lineWins;
    const stepWin = Math.round(wins.reduce((sum, win) => sum + win.amount, 0));

    if (lineWins.length === 0) {
      steps.push({ index, grid: board.map((r) => r.slice()), wins, cleared: [], next: null, stepWin });
      break;
    }

    // Scatters pay but never shatter, so the gate stays readable on screen.
    const cleared = uniqueCells(lineWins);
    const next = dropAndRefill(board, cleared, rng);
    steps.push({ index, grid: board.map((r) => r.slice()), wins, cleared, next, stepWin });
    board = next;
  }

  const finalGrid = board;
  const allWins = steps.flatMap((step) => step.wins).sort((a, b) => b.amount - a.amount);
  const baseWin = steps.reduce((sum, step) => sum + step.stepWin, 0);

  /* ---- rune orbs --------------------------------------------------------- */
  const plan = planOrbs(steps.length, mode, rng);
  const orbMultiplier = baseWin > 0 ? plan.multiplier : 0;
  const orbs = plan.orbs;
  const totalWin = Math.round(baseWin * (orbMultiplier > 0 ? orbMultiplier : 1));

  const anticipationReels: number[] = [];
  if (mode.kind === 'base') {
    let running = 0;
    for (let reel = 0; reel < GRID_COLUMNS; reel += 1) {
      if (landedGrid[reel].includes('scatter')) running += 1;
      else break;
      if (running >= 2 && reel + 1 < GRID_COLUMNS) anticipationReels.push(reel + 1);
    }
  }

  const triggersFreeSpins = mode.kind === 'base' && scatterCount >= SCATTERS_FOR_BONUS;
  const triggersRelicHunt =
    mode.kind === 'base' && !triggersFreeSpins && mysteryCells.length >= 5;

  return {
    landedGrid,
    openingGrid,
    finalGrid,
    mysteryCells,
    mysteryReveal,
    expandedReels,
    scatterCells,
    scatterCount,
    steps,
    wins: allWins,
    baseWin,
    orbs,
    orbMultiplier,
    totalWin,
    tier: tierFor(totalWin, bet),
    triggersFreeSpins,
    triggersRelicHunt,
    anticipationReels,
  };
}

/** A pleasant, non-winning grid used as the resting state before the first spin. */
export function createIdleGrid(rng: RandomFn = defaultRandom): Grid {
  const grid = randomGrid({ rng, mysteryBoost: 0.6, allowScatter: false });
  // Guarantee the resting board never shows a line win.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (evaluateLines(grid, 1, 1).length === 0) break;
    const reel = randomInt(GRID_COLUMNS, rng);
    const row = randomInt(GRID_ROWS, rng);
    grid[reel][row] = pick(['incense', 'fan', 'lantern', 'cup'] as SymbolId[], rng);
  }
  return grid;
}
