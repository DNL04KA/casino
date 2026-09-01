import { motion } from 'framer-motion';
import { SymbolCanvas } from '@/components/common/SymbolCanvas';
import { GUEST_FAVOURS, GUEST_ORDER } from '@/data/guests';
import type { GuestTable } from '@/types';
import { cn } from '@/utils/cn';

interface GuestBenchProps {
  guests: GuestTable;
}

/**
 * The collection, kept in view.
 *
 * A spirit takes its seat the moment its symbol wins, and keeps the favour
 * until the room fills. Showing it as occupied seats rather than a progress bar
 * is the point: the player should read the board as *who is already here*, not
 * as a counter ticking toward a bonus.
 */
export function GuestBench({ guests }: GuestBenchProps): JSX.Element {
  const seated = GUEST_ORDER.filter((id) => guests[id]).length;

  return (
    <div className="relative z-30 px-2 pb-1 sm:px-5" aria-live="polite">
      <div className="glass-panel gold-hairline mx-auto flex max-w-6xl items-center gap-2 rounded-2xl px-2.5 py-1.5 sm:gap-3 sm:px-4 sm:py-2">
        <div className="hidden shrink-0 flex-col leading-none sm:flex">
          <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            The room
          </span>
          <span className="stat-value text-sm font-bold text-gold-light">
            {seated}<span className="text-[10px] text-slate-500">/{GUEST_ORDER.length}</span>
          </span>
        </div>

        <ul className="flex flex-1 items-center justify-between gap-1.5 sm:gap-3">
          {GUEST_ORDER.map((id) => {
            const guest = GUEST_FAVOURS[id];
            const here = guests[id];
            return (
              <li key={id} className="min-w-0 flex-1">
                <motion.div
                  animate={here ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 0.45 }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-1.5 py-1 transition-colors duration-500 sm:gap-2 sm:px-2',
                    here ? 'border-white/15 bg-white/[0.06]' : 'border-white/5 bg-black/20',
                  )}
                  style={here ? { borderColor: `${guest.color}66`, boxShadow: `0 0 18px ${guest.color}22` } : undefined}
                >
                  <span
                    className="shrink-0 transition-all duration-500"
                    style={{
                      filter: here ? 'none' : 'grayscale(1) brightness(0.42)',
                      opacity: here ? 1 : 0.5,
                    }}
                  >
                    <SymbolCanvas id={id} size={34} />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span
                      className="block truncate text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-[11px]"
                      style={{ color: here ? guest.color : '#5A6478' }}
                    >
                      {here ? guest.favour : 'Empty seat'}
                    </span>
                    <span className="hidden truncate text-[9px] text-slate-500 lg:block">
                      {here ? guest.detail : guest.seat}
                    </span>
                  </span>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
