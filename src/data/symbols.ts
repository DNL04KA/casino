import type { SymbolDef, SymbolId } from '@/types';

/**
 * The guest list and the service.
 *
 * High ranks are the spirits who take a table; low ranks are what the house
 * puts in front of them. The three special roles keep functional ids — `wild`,
 * `scatter`, `mystery` describe what a symbol *does*, so they stay stable even
 * when the theme changes around them.
 */
export const SYMBOLS: SymbolDef[] = [
  {
    id: 'kasa',
    name: 'Karakasa',
    kind: 'high',
    label: 'KARAKASA',
    palette: { base: '#2A1608', shade: '#120802', accent: '#F8A65B', glow: '#F8A65B' },
    pays: { 3: 1.5, 4: 5, 5: 15 },
    lore: 'One eye, one leg, and a grudge about being left in a shed for ninety years. Hops in first, every night.',
  },
  {
    id: 'kitsune',
    name: 'Kitsune',
    kind: 'high',
    label: 'KITSUNE',
    palette: { base: '#04231C', shade: '#01110D', accent: '#6BE3C0', glow: '#6BE3C0' },
    pays: { 3: 1.2, 4: 4, 5: 12 },
    lore: 'Pays in leaves that stay coin until sunrise. The house serves her anyway — it is bad luck not to.',
  },
  {
    id: 'okami',
    name: 'The Okami',
    kind: 'high',
    label: 'OKAMI',
    palette: { base: '#1C0F3A', shade: '#0A0620', accent: '#B58CFF', glow: '#8A4DFF' },
    pays: { 3: 1, 4: 3.5, 5: 10 },
    lore: 'Mistress of the house. She has served every spirit on this road and remembers what each one takes in their tea.',
  },
  {
    id: 'tanuki',
    name: 'Tanuki',
    kind: 'high',
    label: 'TANUKI',
    palette: { base: '#2C1804', shade: '#160B02', accent: '#F8C65B', glow: '#F8C65B' },
    pays: { 3: 0.8, 4: 3, 5: 8 },
    lore: 'Orders the expensive pot, drums on his belly, and swears the purse is at home on the shelf.',
  },
  {
    id: 'teapot',
    name: 'Iron Teapot',
    kind: 'low',
    label: 'TEAPOT',
    palette: { base: '#101C33', shade: '#070E1D', accent: '#8FA9D6', glow: '#25D9FF' },
    pays: { 3: 0.3, 4: 0.8, 5: 2 },
    lore: 'Never empty after midnight. Nobody in the house asks why.',
  },
  {
    id: 'cup',
    name: 'Tea Cup',
    kind: 'low',
    label: 'CUP',
    palette: { base: '#0A2A24', shade: '#04140F', accent: '#6BE3C0', glow: '#28D6A0' },
    pays: { 3: 0.25, 4: 0.7, 5: 1.8 },
    lore: 'Chipped on one side. The regulars ask for that one.',
  },
  {
    id: 'lantern',
    name: 'Paper Lantern',
    kind: 'low',
    label: 'LANTERN',
    palette: { base: '#2A1608', shade: '#120802', accent: '#F8A65B', glow: '#F8A65B' },
    pays: { 3: 0.2, 4: 0.6, 5: 1.5 },
    lore: 'Hung at the road so the dead can find the door.',
  },
  {
    id: 'fan',
    name: 'Folding Fan',
    kind: 'low',
    label: 'FAN',
    palette: { base: '#2B1226', shade: '#150913', accent: '#FF4D6D', glow: '#FF4D6D' },
    pays: { 3: 0.15, 4: 0.5, 5: 1.2 },
    lore: 'Left behind by a guest who did not come back. It still opens on its own.',
  },
  {
    id: 'incense',
    name: 'Incense Burner',
    kind: 'low',
    label: 'INCENSE',
    palette: { base: '#22200E', shade: '#111005', accent: '#F8C65B', glow: '#F8C65B' },
    pays: { 3: 0.1, 4: 0.4, 5: 1 },
    lore: 'Lit at dusk. While the smoke rises, the house is open.',
  },
  {
    id: 'wild',
    name: 'Koban Coin',
    kind: 'wild',
    label: 'KOBAN',
    palette: { base: '#2A1D05', shade: '#0E0A02', accent: '#FFE9AE', glow: '#F8C65B' },
    pays: { 3: 2, 4: 6, 5: 20 },
    lore: 'Real gold, still warm. It takes the shape of whatever the table needs.',
  },
  {
    id: 'scatter',
    name: 'Noren Curtain',
    kind: 'scatter',
    label: 'NOREN',
    palette: { base: '#12093A', shade: '#060218', accent: '#25D9FF', glow: '#8A4DFF' },
    pays: { 3: 1, 4: 3, 5: 8 },
    lore: 'Three of them part at once and the whole road comes in for the midnight service.',
  },
  {
    id: 'mystery',
    name: 'Sealed Ofuda',
    kind: 'mystery',
    label: 'OFUDA',
    palette: { base: '#1B0F3B', shade: '#0A0520', accent: '#C9A6FF', glow: '#8A4DFF' },
    pays: { 3: 0, 4: 0, 5: 0 },
    lore: 'A paper seal, still damp with ink. It never says what it holds until the pot is poured.',
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
