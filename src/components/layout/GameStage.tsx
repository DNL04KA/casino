import type { ReactNode } from 'react';
import { PhaserGame } from '@/game/PhaserGame';
import { RunePillar } from '@/components/layout/RunePillar';
import type { GuardianId } from '@/types';
import { GUARDIAN_MAP } from '@/data/guardians';
import { PAYLINE_COUNT } from '@/data/paylines';

interface GameStageProps {
  guardian: GuardianId | null;
  mounted: boolean;
  /** Wakes the flanking colossi during a celebration. */
  excited?: boolean;
  /** The live round read-out replaces the nameplate while a round plays. */
  hideTitle?: boolean;
  onRendererError: (message: string) => void;
  children?: ReactNode;
}

const CARTOUCHE = 'polygon(6% 0%, 94% 0%, 100% 50%, 94% 100%, 6% 100%, 0% 50%)';

/** Gold filigree tucked into each corner of the cabinet. */
function CornerFiligree({ className }: { className: string }): JSX.Element {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 18V3h15" />
        <path d="M7 25C7 14 14 7 25 7" opacity="0.7" />
        <path d="M9 9l9 9" />
        <path d="M3 30c8 0 14-6 14-14" opacity="0.4" />
      </g>
      <circle cx="9" cy="9" r="2.4" fill="currentColor" />
    </svg>
  );
}

/** The framed reel area: stone pillars, colossi, gold cabinet, Phaser canvas. */
export function GameStage({
  guardian,
  mounted,
  excited = false,
  hideTitle = false,
  onRendererError,
  children,
}: GameStageProps): JSX.Element {
  const accent = guardian ? GUARDIAN_MAP[guardian].colors.primary : '#25D9FF';

  return (
    <main className="relative z-20 flex min-h-0 flex-1 items-center justify-center gap-1 px-2 sm:px-4 xl:gap-4">
      <RunePillar side="left" guardian={guardian} excited={excited} />

      <div
        className="relative h-auto w-full max-w-[1120px] landscape:h-full landscape:max-h-full landscape:w-auto"
        style={{ aspectRatio: '12 / 7' }}
      >
        {/* Outer glow bed */}
        <div
          className="pointer-events-none absolute -inset-6 rounded-[40px] opacity-70 blur-2xl transition-colors duration-700"
          style={{ background: `radial-gradient(60% 60% at 50% 50%, ${accent}33 0%, transparent 70%)` }}
          aria-hidden="true"
        />

        {/* Cabinet */}
        <div className="reel-frame absolute inset-0 overflow-hidden rounded-[26px] p-2 sm:p-3">
          <div
            className="pointer-events-none absolute inset-[6px] rounded-[20px] border border-white/[0.06]"
            aria-hidden="true"
          />

          {/* Reel column separators */}
          <div className="pointer-events-none absolute inset-y-5 left-0 w-full" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="absolute top-0 h-full w-px"
                style={{
                  left: `${i * 20}%`,
                  background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)',
                }}
              />
            ))}
          </div>

          {mounted && <PhaserGame onError={onRendererError} />}

          {/* Inner vignette keeps the eye on the middle of the board */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[24px]"
            style={{
              background:
                'radial-gradient(85% 75% at 50% 50%, transparent 55%, rgba(3,6,14,0.55) 100%)',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Corner filigree */}
        <CornerFiligree className="pointer-events-none absolute left-1 top-1 h-6 w-6 text-gold/60 sm:h-9 sm:w-9" />
        <CornerFiligree className="pointer-events-none absolute right-1 top-1 h-6 w-6 -scale-x-100 text-gold/60 sm:h-9 sm:w-9" />
        <CornerFiligree className="pointer-events-none absolute bottom-1 left-1 h-6 w-6 -scale-y-100 text-gold/60 sm:h-9 sm:w-9" />
        <CornerFiligree className="pointer-events-none absolute bottom-1 right-1 h-6 w-6 -scale-100 text-gold/60 sm:h-9 sm:w-9" />

        {/* Top cartouche */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 flex w-[min(72%,380px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-opacity duration-300"
          style={{ opacity: hideTitle ? 0 : 1 }}
          aria-hidden="true"
        >
          <div
            className="w-full p-[2px]"
            style={{
              clipPath: CARTOUCHE,
              background: 'linear-gradient(180deg,#FFE9AE 0%,#F8C65B 40%,#8A6416 100%)',
              boxShadow: `0 0 28px ${accent}55`,
            }}
          >
            <div
              className="flex w-full items-center justify-center gap-2 px-6 py-1.5 sm:gap-3 sm:py-2"
              style={{
                clipPath: CARTOUCHE,
                background: 'linear-gradient(180deg,#1B2542 0%,#080D1B 100%)',
              }}
            >
              <span className="text-[8px] text-gold/70 sm:text-[10px]">◆</span>
              <span className="whitespace-nowrap font-display text-[10px] uppercase tracking-[0.24em] text-gold-light sm:text-xs sm:tracking-[0.3em]">
                Neon Temple
              </span>
              <span className="text-[8px] text-gold/70 sm:text-[10px]">◆</span>
            </div>
          </div>
        </div>

        {/* Bottom demo plate */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
          aria-hidden="true"
        >
          <span className="demo-chip block whitespace-nowrap rounded-full px-3 py-0.5 text-[7px] font-bold sm:px-4 sm:py-1 sm:text-[9px]">
            For Demo Purposes
            <span className="hidden sm:inline"> · {PAYLINE_COUNT} demo lines · tumbling wins</span>
          </span>
        </div>

        {children}
      </div>

      <RunePillar side="right" guardian={guardian} excited={excited} />
    </main>
  );
}
