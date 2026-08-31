import type { SymbolDef, SymbolId } from '@/types';

/**
 * Original symbol set for Neon Temple: Guardians of Fortune.
 * Every glyph is drawn procedurally (see src/game/art) — no third-party assets.
 */
export const SYMBOLS: SymbolDef[] = [
  {
    id: 'dragon',
    name: 'Jade Dragon',
    kind: 'high',
    label: 'JADE DRAGON',
    palette: { base: '#07271F', shade: '#04140F', accent: '#28D6A0', glow: '#28D6A0' },
    pays: { 3: 1.5, 4: 5, 5: 15 },
    lore: 'The temple river froze into jade the night the dragon first coiled around its spire.',
  },
  {
    id: 'mask',
    name: 'Warden Mask',
    kind: 'high',
    label: 'WARDEN MASK',
    palette: { base: '#0B2036', shade: '#050D1C', accent: '#25D9FF', glow: '#25D9FF' },
    pays: { 3: 1.2, 4: 4, 5: 12 },
    lore: 'Carved for the sentries who never sleep; its eyes still track movement in the fog.',
  },
  {
    id: 'empress',
    name: 'Night Empress',
    kind: 'high',
    label: 'NIGHT EMPRESS',
    palette: { base: '#1C0F3A', shade: '#0B0620', accent: '#B58CFF', glow: '#8A4DFF' },
    pays: { 3: 1, 4: 3.5, 5: 10 },
    lore: 'She traded daylight for a crown of moon-glass and has ruled the summit ever since.',
  },
  {
    id: 'tiger',
    name: 'Golden Tiger',
    kind: 'high',
    label: 'GOLDEN TIGER',
    palette: { base: '#2C1804', shade: '#160B02', accent: '#F8C65B', glow: '#F8C65B' },
    pays: { 3: 0.8, 4: 3, 5: 8 },
    lore: 'Struck from temple gold, it prowls the stairways whenever the runes burn too bright.',
  },
  {
    id: 'ace',
    name: 'Neon Ace',
    kind: 'low',
    label: 'A',
    palette: { base: '#101C33', shade: '#070E1D', accent: '#25D9FF', glow: '#25D9FF' },
    pays: { 3: 0.3, 4: 0.8, 5: 2 },
    lore: 'Circuit-etched sigil of the first temple gate.',
  },
  {
    id: 'king',
    name: 'Neon King',
    kind: 'low',
    label: 'K',
    palette: { base: '#171233', shade: '#0A0819', accent: '#8A4DFF', glow: '#8A4DFF' },
    pays: { 3: 0.25, 4: 0.7, 5: 1.8 },
    lore: 'Marks the second gate, where the fog begins to hum.',
  },
  {
    id: 'queen',
    name: 'Neon Queen',
    kind: 'low',
    label: 'Q',
    palette: { base: '#0A2A24', shade: '#04140F', accent: '#28D6A0', glow: '#28D6A0' },
    pays: { 3: 0.2, 4: 0.6, 5: 1.5 },
    lore: 'Third gate sigil, cut in emerald light.',
  },
  {
    id: 'jack',
    name: 'Neon Jack',
    kind: 'low',
    label: 'J',
    palette: { base: '#2B1226', shade: '#150913', accent: '#FF4D6D', glow: '#FF4D6D' },
    pays: { 3: 0.15, 4: 0.5, 5: 1.2 },
    lore: 'Fourth gate sigil, burning a low crimson.',
  },
  {
    id: 'ten',
    name: 'Neon Ten',
    kind: 'low',
    label: '10',
    palette: { base: '#22200E', shade: '#111005', accent: '#F8C65B', glow: '#F8C65B' },
    pays: { 3: 0.1, 4: 0.4, 5: 1 },
    lore: 'The outermost sigil, closest to the cliff edge.',
  },
  {
    id: 'wild',
    name: 'Celestial Wild',
    kind: 'wild',
    label: 'WILD',
    palette: { base: '#2A1D05', shade: '#0E0A02', accent: '#FFE9AE', glow: '#F8C65B' },
    pays: { 3: 2, 4: 6, 5: 20 },
    lore: 'An amulet of star-metal. It borrows the shape of any ordinary symbol it touches.',
  },
  {
    id: 'scatter',
    name: 'Temple Gate',
    kind: 'scatter',
    label: 'GATE',
    palette: { base: '#12093A', shade: '#060218', accent: '#25D9FF', glow: '#8A4DFF' },
    pays: { 3: 1, 4: 3, 5: 8 },
    lore: 'Three gates aligned and the summit opens into the Guardians’ sanctum.',
  },
  {
    id: 'mystery',
    name: 'Mystery Rune',
    kind: 'mystery',
    label: 'RUNE',
    palette: { base: '#1B0F3B', shade: '#0A0520', accent: '#C9A6FF', glow: '#8A4DFF' },
    pays: { 3: 0, 4: 0, 5: 0 },
    lore: 'Unreadable until the spin settles — then it always chooses a guardian to become.',
  },
];

export const SYMBOL_MAP: Record<SymbolId, SymbolDef> = SYMBOLS.reduce((acc, symbol) => {
  acc[symbol.id] = symbol;
  return acc;
}, {} as Record<SymbolId, SymbolDef>);

export const HIGH_SYMBOLS: SymbolId[] = SYMBOLS.filter((s) => s.kind === 'high').map((s) => s.id);
export const LOW_SYMBOLS: SymbolId[] = SYMBOLS.filter((s) => s.kind === 'low').map((s) => s.id);

export function getSymbol(id: SymbolId): SymbolDef {
  return SYMBOL_MAP[id];
}
