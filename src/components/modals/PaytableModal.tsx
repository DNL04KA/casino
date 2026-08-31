import { Modal } from '@/components/common/Modal';
import { SymbolCanvas } from '@/components/common/SymbolCanvas';
import { PAYLINES } from '@/data/paylines';
import { SYMBOLS } from '@/data/symbols';
import { GRID_COLUMNS, GRID_ROWS } from '@/data/config';
import type { SymbolDef } from '@/types';
import { ORB_VALUES } from '@/utils/spinEngine';
import { cn } from '@/utils/cn';

/** Orb colour rises with its face value — mirrors the in-game tint ladder. */
function orbColor(value: number): string {
  if (value >= 100) return '#FF4D6D';
  if (value >= 25) return '#F8C65B';
  if (value >= 10) return '#8A4DFF';
  return '#25D9FF';
}

interface PaytableModalProps {
  open: boolean;
  onClose: () => void;
  bet: number;
}

function PayRow({ count, value, bet }: { count: number; value: number; bet: number }) {
  if (value <= 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="text-slate-400">{count} in a row</span>
      <span className="stat-value font-semibold text-gold-light">
        {(value * bet).toLocaleString('en-US', { maximumFractionDigits: 0 })}
        <span className="ml-1 text-[9px] font-normal text-slate-500">({value}× stake)</span>
      </span>
    </div>
  );
}

function SymbolCard({ symbol, bet }: { symbol: SymbolDef; bet: number }) {
  const kindLabel: Record<SymbolDef['kind'], string> = {
    high: 'High pay',
    low: 'Low pay',
    wild: 'Wild',
    scatter: 'Scatter',
    mystery: 'Mystery',
  };

  return (
    <div
      className={cn(
        'glass-panel gold-hairline flex gap-3 rounded-2xl p-3',
        symbol.kind !== 'high' && symbol.kind !== 'low' && 'sm:col-span-2',
      )}
    >
      <SymbolCanvas id={symbol.id} size={84} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-display text-sm text-gold-light">{symbol.name}</p>
          <span
            className="shrink-0 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
            style={{ borderColor: `${symbol.palette.glow}66`, color: symbol.palette.glow }}
          >
            {kindLabel[symbol.kind]}
          </span>
        </div>

        {symbol.kind === 'mystery' ? (
          <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
            Pays nothing on its own. Transforms into a single high-pay guardian symbol once the reels settle.
          </p>
        ) : (
          <div className="mt-1.5 space-y-0.5">
            <PayRow count={5} value={symbol.pays[5]} bet={bet} />
            <PayRow count={4} value={symbol.pays[4]} bet={bet} />
            <PayRow count={3} value={symbol.pays[3]} bet={bet} />
          </div>
        )}

        <p className="mt-1.5 text-[10px] leading-snug text-slate-500">{symbol.lore}</p>
      </div>
    </div>
  );
}

function LineDiagram({ rows, id, name }: { rows: number[]; id: number; name: string }) {
  return (
    <div className="glass-panel rounded-xl p-2">
      <div className="flex items-center justify-between px-0.5 pb-1">
        <span className="stat-value text-[10px] text-cyan-neon">#{id}</span>
        <span className="truncate text-[9px] uppercase tracking-[0.14em] text-slate-500">{name}</span>
      </div>
      <div className="relative grid grid-cols-5 gap-[3px]">
        {Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, i) => {
          const reel = i % GRID_COLUMNS;
          const row = Math.floor(i / GRID_COLUMNS);
          const active = rows[reel] === row;
          return (
            <span
              key={i}
              className={cn(
                'aspect-square rounded-[3px] transition-colors',
                active ? 'bg-gradient-to-br from-gold-light to-gold' : 'bg-white/[0.07]',
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

export function PaytableModal({ open, onClose, bet }: PaytableModalProps): JSX.Element {
  const highs = SYMBOLS.filter((s) => s.kind === 'high');
  const lows = SYMBOLS.filter((s) => s.kind === 'low');
  const specials = SYMBOLS.filter((s) => s.kind === 'wild' || s.kind === 'scatter' || s.kind === 'mystery');

  return (
    <Modal open={open} onClose={onClose} title="Paytable" eyebrow="Visual demo values" className="max-w-5xl">
      <div className="rounded-2xl border border-gold/30 bg-gold/[0.07] px-4 py-3 text-xs leading-relaxed text-gold-light">
        All figures below are <strong>visual demo values</strong> shown at the current demo stake of{' '}
        <span className="stat-value">{bet.toLocaleString('en-US')}</span> demo points. They describe the
        presentation only — this build has no RTP, no wagering model and no payouts of any kind.
      </div>

      <h3 className="mt-6 font-display text-lg text-gold-light">Rune Orbs</h3>
      <p className="mt-1 text-xs text-slate-400">
        Orbs land on top of the reels and never join a payline. When a round wins, every orb on screen fuses
        into a single multiplier applied to the whole round — tumbles included.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ORB_VALUES.map((value) => (
          <div
            key={value}
            className="glass-panel flex min-w-[74px] flex-col items-center gap-0.5 rounded-2xl px-3 py-2"
            style={{ borderColor: `${orbColor(value)}66` }}
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold text-night-900"
              style={{
                background: `radial-gradient(circle at 34% 30%, #FFFFFF 0%, ${orbColor(value)} 62%, #101828 100%)`,
                boxShadow: `0 0 14px ${orbColor(value)}88`,
              }}
            >
              ×{value}
            </span>
            <span className="stat-value text-[10px] text-slate-400">
              {(value * bet).toLocaleString('en-US')}
            </span>
          </div>
        ))}
      </div>

      <h3 className="mt-6 font-display text-lg text-gold-light">Special symbols</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {specials.map((symbol) => (
          <SymbolCard key={symbol.id} symbol={symbol} bet={bet} />
        ))}
      </div>

      <h3 className="mt-6 font-display text-lg text-gold-light">Guardians — high pay</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {highs.map((symbol) => (
          <SymbolCard key={symbol.id} symbol={symbol} bet={bet} />
        ))}
      </div>

      <h3 className="mt-6 font-display text-lg text-gold-light">Temple sigils — low pay</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {lows.map((symbol) => (
          <SymbolCard key={symbol.id} symbol={symbol} bet={bet} />
        ))}
      </div>

      <h3 className="mt-6 font-display text-lg text-gold-light">{PAYLINES.length} demo lines</h3>
      <p className="mt-1 text-xs text-slate-400">
        Lines are evaluated left to right from reel 1. Only the highest combination on each line is counted, and
        every winning symbol tumbles away so the board can pay again.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {PAYLINES.map((line) => (
          <LineDiagram key={line.id} id={line.id} name={line.name} rows={line.rows} />
        ))}
      </div>
    </Modal>
  );
}
