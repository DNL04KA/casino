import { motion } from 'framer-motion';
import { AUTO_SPIN_MAX, BET_STEPS } from '@/data/config';
import { IconButton } from '@/components/ui/IconButton';
import { SpinButton } from '@/components/ui/SpinButton';
import { StatTile } from '@/components/ui/StatTile';
import { AutoIcon, BoltIcon, MinusIcon, PlusIcon, RefreshIcon, StopIcon } from '@/components/ui/icons';
import { useCountUp } from '@/hooks/useCountUp';
import { soundEngine } from '@/audio/SoundEngine';
import type { AutoSpinState, GamePhase, WinTier } from '@/types';
import { formatCredits } from '@/utils/format';
import { cn } from '@/utils/cn';

interface BottomBarProps {
  credits: number;
  bet: number;
  betIndex: number;
  lastWin: number;
  tier: WinTier;
  phase: GamePhase;
  turbo: boolean;
  auto: AutoSpinState;
  countUpDuration: number;
  onSpin: () => void;
  onAuto: () => void;
  onTurbo: () => void;
  onBetChange: (direction: 1 | -1) => void;
  onTopUp: () => void;
}

const TIER_TEXT: Record<WinTier, string> = {
  none: 'text-slate-500',
  small: 'text-emerald-neon',
  nice: 'text-emerald-neon',
  big: 'text-gold-light',
  mega: 'text-gold-light',
  epic: 'text-crimson-neon',
};

export function BottomBar({
  credits,
  bet,
  betIndex,
  lastWin,
  tier,
  phase,
  turbo,
  auto,
  countUpDuration,
  onSpin,
  onAuto,
  onTurbo,
  onBetChange,
  onTopUp,
}: BottomBarProps): JSX.Element {
  const spinning = phase === 'spinning' || phase === 'freeSpins' || phase === 'bigWin';
  const locked = spinning || phase === 'bonusIntro' || phase === 'pickRelic' || phase === 'summary';
  const displayedWin = useCountUp(lastWin, {
    duration: countUpDuration,
    onTick: (step) => {
      if (lastWin > 0) soundEngine.tick(step);
    },
  });

  return (
    <footer className="relative z-30 px-2 pb-2 pt-1 sm:px-5 sm:pb-3">
      <div className="glass-panel gold-hairline mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 rounded-3xl px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
        {/* Balance + stake */}
        <div className="flex w-full min-w-0 gap-2 sm:w-auto sm:flex-1">
          <StatTile
            label="Demo Credits"
            value={formatCredits(credits)}
            hint="virtual · no cash value"
            accent="gold"
            className="flex-1"
          >
            {credits < bet && (
              <button
                type="button"
                onClick={onTopUp}
                className="mt-1 inline-flex items-center gap-1 self-start rounded-lg border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold-light transition hover:bg-gold/15"
              >
                <RefreshIcon />
                Reload
              </button>
            )}
          </StatTile>

          <StatTile label="Demo Stake" value={formatCredits(bet)} accent="cyan" className="flex-1">
            <div className="mt-1.5 flex items-center gap-1.5">
              <IconButton
                icon={<MinusIcon />}
                label="Decrease demo stake"
                onClick={() => onBetChange(-1)}
                disabled={locked || betIndex === 0}
                className="!h-7 !px-1.5"
              />
              <div className="hidden flex-1 overflow-hidden rounded-full bg-white/10 sm:block" aria-hidden="true">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-cyan-neon to-violet-neon transition-all duration-300"
                  style={{ width: `${((betIndex + 1) / BET_STEPS.length) * 100}%` }}
                />
              </div>
              <IconButton
                icon={<PlusIcon />}
                label="Increase demo stake"
                onClick={() => onBetChange(1)}
                disabled={locked || betIndex === BET_STEPS.length - 1}
                className="!h-7 !px-1.5"
              />
            </div>
          </StatTile>
        </div>

        {/* Turbo · Spin · Auto */}
        <div className="order-last flex w-full items-center justify-center gap-3 sm:order-none sm:w-auto">
          <div className="flex flex-col items-stretch gap-1.5">
            <IconButton
              icon={<BoltIcon />}
              label="Turbo mode"
              showLabel
              active={turbo}
              tone="gold"
              onClick={onTurbo}
              className="!h-9"
            />
            <IconButton
              icon={auto.active ? <StopIcon /> : <AutoIcon />}
              label={auto.active ? `Stop auto spin (${auto.remaining} left)` : 'Auto spin'}
              showLabel
              active={auto.active}
              tone="violet"
              onClick={onAuto}
              disabled={phase === 'bonusIntro' || phase === 'pickRelic' || phase === 'summary'}
              className="!h-9"
            />
          </div>

          <SpinButton
            onClick={auto.active ? onAuto : onSpin}
            spinning={spinning}
            autoActive={auto.active}
            disabled={locked && !auto.active}
          />

          <div className="hidden w-[86px] flex-col items-center gap-1 sm:flex">
            {auto.active ? (
              <span className="stat-value rounded-full border border-violet-neon/50 bg-violet-neon/10 px-2.5 py-1 text-[11px] text-violet-neon">
                {auto.remaining}/{AUTO_SPIN_MAX}
              </span>
            ) : (
              <span className="text-center text-[9px] uppercase leading-tight tracking-[0.18em] text-slate-500">
                Press Space
              </span>
            )}
          </div>
        </div>

        {/* Win meter */}
        <div className="flex w-full min-w-0 items-center justify-end gap-3 sm:w-auto sm:flex-1">
          <p className="hidden max-w-[190px] text-right text-[10px] leading-relaxed text-slate-500 2xl:block">
            Space spins · T turbo · A auto · +/− stake · I info · P paytable · H history · M sound
          </p>
          <StatTile
            label="Demo Win"
            value={
              <motion.span
                key={tier + String(lastWin)}
                initial={{ scale: 1 }}
                animate={{ scale: lastWin > 0 ? [1, 1.12, 1] : 1 }}
                transition={{ duration: 0.4 }}
                className={cn('inline-block', TIER_TEXT[tier])}
              >
                {formatCredits(displayedWin)}
              </motion.span>
            }
            hint={tier === 'none' ? 'demo points' : `${tier} win`}
            accent="emerald"
            className="flex-1 sm:max-w-[190px] sm:flex-none"
          />
        </div>
      </div>
    </footer>
  );
}
