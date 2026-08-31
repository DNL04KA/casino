import { Modal } from '@/components/common/Modal';
import { SymbolCanvas } from '@/components/common/SymbolCanvas';
import type { HistoryEntry, WinTier } from '@/types';
import { formatCredits, formatTime } from '@/utils/format';
import { cn } from '@/utils/cn';

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  history: HistoryEntry[];
}

const TIER_BADGE: Record<WinTier, string> = {
  none: 'border-white/10 text-slate-500',
  small: 'border-emerald-neon/40 text-emerald-neon',
  nice: 'border-emerald-neon/60 text-emerald-neon',
  big: 'border-gold/60 text-gold-light',
  mega: 'border-violet-neon/60 text-violet-neon',
  epic: 'border-crimson-neon/60 text-crimson-neon',
};

/** The last ten demo rounds, newest first. */
export function HistoryModal({ open, onClose, history }: HistoryModalProps): JSX.Element {
  return (
    <Modal open={open} onClose={onClose} title="Demo Round History" eyebrow="Last 10 results" className="max-w-2xl">
      {history.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          No demo rounds yet. Press SPIN to start the showcase.
        </p>
      ) : (
        <ul className="space-y-2">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="glass-panel gold-hairline flex items-center gap-3 rounded-2xl px-3 py-2.5"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                {entry.topSymbol ? (
                  <SymbolCanvas id={entry.topSymbol} size={40} />
                ) : (
                  <span className="text-[10px] uppercase tracking-widest text-slate-600">—</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="stat-value text-sm font-semibold text-slate-200">Round {entry.index}</span>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em]',
                      TIER_BADGE[entry.tier],
                    )}
                  >
                    {entry.tier === 'none' ? 'no win' : entry.tier}
                  </span>
                  {entry.mode === 'free' && (
                    <span className="rounded-full border border-violet-neon/50 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-violet-neon">
                      free spin
                    </span>
                  )}
                  {entry.orbMultiplier > 0 && (
                    <span className="stat-value rounded-full border border-gold/60 bg-gold/10 px-2 py-0.5 text-[9px] font-bold text-gold-light">
                      orbs ×{entry.orbMultiplier}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {formatTime(entry.timestamp)} · stake {formatCredits(entry.bet)} · {entry.lines} line
                  {entry.lines === 1 ? '' : 's'}
                  {entry.tumbles > 0 ? ` · ${entry.tumbles} tumble${entry.tumbles === 1 ? '' : 's'}` : ''}
                  {entry.scatters >= 3 ? ` · ${entry.scatters} gates` : ''}
                </p>
              </div>

              <p
                className={cn(
                  'stat-value shrink-0 text-right text-base font-bold',
                  entry.win > 0 ? 'text-gold-light' : 'text-slate-600',
                )}
              >
                {entry.win > 0 ? `+${formatCredits(entry.win)}` : '—'}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 text-center text-[10px] leading-relaxed text-slate-500">
        History is kept in memory for this session only and records virtual demo points.
      </p>
    </Modal>
  );
}
