/**
 * Neon Temple: Guardians of Fortune
 * Shared domain types.
 *
 * IMPORTANT: every numeric value in this project is a *virtual demo point*.
 * Nothing here models money, wagering, odds disclosure or payout obligations.
 */

export type SymbolId =
  | 'kasa'
  | 'kitsune'
  | 'okami'
  | 'tanuki'
  | 'teapot'
  | 'cup'
  | 'lantern'
  | 'fan'
  | 'incense'
  | 'wild'
  | 'scatter'
  | 'mystery';

export type SymbolKind = 'high' | 'low' | 'wild' | 'scatter' | 'mystery';

export interface SymbolPalette {
  /** Panel base colour behind the glyph. */
  base: string;
  /** Secondary panel colour (gradient end). */
  shade: string;
  /** Main glyph colour. */
  accent: string;
  /** Neon frame + outer glow colour. */
  glow: string;
}

export interface SymbolDef {
  id: SymbolId;
  name: string;
  kind: SymbolKind;
  /** Short label rendered under high-pay art / used as fallback glyph. */
  label: string;
  palette: SymbolPalette;
  /** Demo point multipliers applied to the virtual stake. Presentation only. */
  pays: { 3: number; 4: number; 5: number };
  lore: string;
}

/** Reel-major grid: grid[reel][row]. */
export type Grid = SymbolId[][];

/** [reel, row] */
export type Cell = readonly [number, number];

export interface Payline {
  id: number;
  name: string;
  /** Row index picked on each of the five reels. */
  rows: [number, number, number, number, number];
}

export interface LineWin {
  lineId: number;
  lineName: string;
  symbol: SymbolId;
  count: number;
  cells: Cell[];
  /** Virtual demo points awarded for this line. */
  amount: number;
  /** Bonus multiplier that was applied (free-spins feature). */
  multiplier: number;
}

export type WinTier = 'none' | 'small' | 'nice' | 'big' | 'mega' | 'epic';

export type GuardianId = 'kasa' | 'kitsune' | 'tanuki';

/** The four spirits who can take a seat in the room. */
export type GuestId = 'kasa' | 'kitsune' | 'okami' | 'tanuki';

/** Who is currently seated. A served guest keeps its favour until the room clears. */
export type GuestTable = Record<GuestId, boolean>;

export interface Guardian {
  id: GuardianId;
  name: string;
  title: string;
  tagline: string;
  /** Purely cosmetic feature description shown in the demo UI. */
  feature: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    aura: string;
  };
}

export type SpinMode =
  | { kind: 'base' }
  | { kind: 'free'; guardian: GuardianId; multiplier: number };

/** A glowing Rune Orb that multiplies the whole round when a win lands. */
export interface OrbDrop {
  id: string;
  cell: Cell;
  /** Visual multiplier value carried by the orb. */
  value: number;
  /** Tumble step the orb lands on (0 = the initial drop). */
  step: number;
}

/** One link in a tumble chain: a board, its wins, and what it clears. */
export interface TumbleStep {
  index: number;
  /** Board as it looks at the start of this step. */
  grid: Grid;
  wins: LineWin[];
  /** Cells that shatter at the end of this step. */
  cleared: Cell[];
  /** Board after the survivors drop and the gaps refill. */
  next: Grid | null;
  /** Virtual demo points won on this step alone. */
  stepWin: number;
}

export interface SpinOutcome {
  /** Grid exactly as it lands on the reels (may still contain mystery runes). */
  landedGrid: Grid;
  /** Grid after mystery runes transform and wilds expand — the first tumble board. */
  openingGrid: Grid;
  /** Board left standing once every tumble has resolved. */
  finalGrid: Grid;
  mysteryCells: Cell[];
  mysteryReveal: SymbolId | null;
  expandedReels: number[];
  scatterCells: Cell[];
  scatterCount: number;
  /** The full tumble chain. Always at least one entry. */
  steps: TumbleStep[];
  /** Every win across every step, richest first. */
  wins: LineWin[];
  /** Demo points from the tumble chain, before Rune Orbs. */
  baseWin: number;
  orbs: OrbDrop[];
  /** Summed orb value, or 0 when no orb is collected. */
  orbMultiplier: number;
  /** Total virtual demo points for the spin. */
  totalWin: number;
  tier: WinTier;
  triggersFreeSpins: boolean;
  triggersRelicHunt: boolean;
  /** Reels that should play the slow "anticipation" stop. */
  anticipationReels: number[];
}

export type RelicRewardType =
  | 'multiplier'
  | 'wildExpansion'
  | 'extraSpins'
  | 'mysteryReveal'
  | 'points';

export interface RelicReward {
  type: RelicRewardType;
  label: string;
  detail: string;
  /** Virtual demo points granted by this relic. */
  points: number;
  /** Cosmetic accent colour of the reward card. */
  color: string;
}

export interface RelicCard {
  index: number;
  name: string;
  revealed: boolean;
  reward: RelicReward | null;
}

export interface HistoryEntry {
  id: string;
  index: number;
  timestamp: number;
  bet: number;
  win: number;
  tier: WinTier;
  mode: 'base' | 'free' | 'relic';
  topSymbol: SymbolId | null;
  lines: number;
  scatters: number;
  /** How many times the board tumbled during the round. */
  tumbles: number;
  /** Combined Rune Orb multiplier, or 0 when none were collected. */
  orbMultiplier: number;
}

/**
 * Demo state machine. The eight states required by the design brief plus the
 * two shell states used before the reels are live.
 */
export type GamePhase =
  | 'preload'
  | 'intro'
  | 'idle'
  | 'spinning'
  | 'result'
  | 'bigWin'
  | 'bonusIntro'
  | 'freeSpins'
  | 'pickRelic'
  | 'summary';

export type ModalId = 'info' | 'paytable' | 'history' | null;

export interface BonusState {
  active: boolean;
  guardian: GuardianId | null;
  /** True while the guardian picker is on screen. */
  choosing: boolean;
  spinsTotal: number;
  spinsLeft: number;
  multiplier: number;
  total: number;
}

export interface RelicState {
  active: boolean;
  cards: RelicCard[];
  picksLeft: number;
  total: number;
  finished: boolean;
}

export interface AutoSpinState {
  active: boolean;
  remaining: number;
}

/** Live read-out of the tumble chain while it plays. */
export interface RoundProgress {
  active: boolean;
  tumble: number;
  tumbleTotal: number;
  running: number;
  orbMultiplier: number;
  collecting: boolean;
}

export interface GameState {
  phase: GamePhase;
  /** Virtual demo credits — not money, not redeemable, not transferable. */
  credits: number;
  betIndex: number;
  bet: number;
  lastWin: number;
  sessionWin: number;
  grid: Grid;
  wins: LineWin[];
  tier: WinTier;
  history: HistoryEntry[];
  spinCount: number;
  auto: AutoSpinState;
  turbo: boolean;
  bonus: BonusState;
  relic: RelicState;
  modal: ModalId;
  /** The collection: every spirit served so far stays and lends a favour. */
  guests: GuestTable;
  progress: RoundProgress;
  notice: string | null;
  summary: { title: string; total: number; subtitle: string } | null;
}
