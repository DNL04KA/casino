import { Modal } from '@/components/common/Modal';
import { SymbolCanvas } from '@/components/common/SymbolCanvas';
import { GuardianEmblem } from '@/components/common/GuardianEmblem';
import { GUARDIANS } from '@/data/guardians';
import { DEMO_DISCLAIMER, FREE_SPINS_AWARD, RELIC_PICKS, SCATTERS_FOR_BONUS } from '@/data/config';
import { PAYLINE_COUNT } from '@/data/paylines';
import { ORB_VALUES } from '@/utils/spinEngine';
import { SYMBOLS } from '@/data/symbols';

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="font-display text-lg text-gold-light">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

export function InfoModal({ open, onClose }: InfoModalProps): JSX.Element {
  const specials = SYMBOLS.filter((s) => s.kind === 'wild' || s.kind === 'scatter' || s.kind === 'mystery');

  return (
    <Modal open={open} onClose={onClose} title="Game Info" eyebrow="Neon Temple: Guardians of Fortune">
      <div className="rounded-2xl border border-crimson-neon/40 bg-crimson-neon/10 px-4 py-3 text-sm text-[#FFC9D4]">
        <strong className="font-semibold">{DEMO_DISCLAIMER}</strong>
      </div>

      <Section title="The world">
        <p>
          High above a drowned valley, a temple was rebuilt out of stone and circuitry. Its keepers replaced
          torchlight with cold neon and sealed four guardian spirits into the reels that hold the summit
          together. Every night the runes wake up, the fog climbs the stairs, and the Temple Gate tests whoever
          made the climb.
        </p>
        <p>
          Neon Temple is a presentation build: a five-reel, three-row board on {PAYLINE_COUNT} fixed demo lines
          with tumbling wins and Rune Orb multipliers, made to show reel feel, feature staging and celebration
          design rather than any commercial maths.
        </p>
      </Section>

      <Section title="Special symbols">
        <div className="grid gap-3 sm:grid-cols-3">
          {specials.map((symbol) => (
            <div key={symbol.id} className="glass-panel gold-hairline flex gap-3 rounded-2xl p-3">
              <SymbolCanvas id={symbol.id} size={72} />
              <div className="min-w-0">
                <p className="font-display text-sm text-gold-light">{symbol.name}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-neon/80">{symbol.kind}</p>
                <p className="mt-1 text-[11px] leading-snug text-slate-400">{symbol.lore}</p>
              </div>
            </div>
          ))}
        </div>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300">
          <li>
            <strong className="text-gold-light">Celestial Wild</strong> substitutes for every symbol except the
            Temple Gate and the Mystery Rune, and pays on its own line as the top symbol.
          </li>
          <li>
            <strong className="text-gold-light">Temple Gate</strong> pays from anywhere on the board.{' '}
            {SCATTERS_FOR_BONUS} or more open the Guardians’ Free Spins.
          </li>
          <li>
            <strong className="text-gold-light">Mystery Rune</strong> stays unreadable until the reels settle, then
            every rune on screen flips to the same high-pay guardian symbol.
          </li>
        </ul>
      </Section>

      <Section title="Tumbling reels">
        <p>
          Every winning combination shatters. The symbols above it fall into the gaps, fresh ones drop in from
          over the frame, and the board pays again — as many times as it keeps hitting. A round can chain up to
          eight tumbles, and the counter above the reels tracks the chain and the running demo total.
        </p>
      </Section>

      <Section title="Rune Orbs">
        <p>
          Glowing orbs drop onto the board carrying a demo multiplier. They ignore the paylines entirely and
          simply wait. If the round ends with any win at all, every orb on screen flies to the centre, the values
          fuse into one multiplier and the whole round total is multiplied by it. Orbs on a losing round do
          nothing.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ORB_VALUES.map((value) => (
            <span
              key={value}
              className="stat-value rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold-light"
            >
              ×{value}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          Orb values are visual demo values. Several orbs on one round add together before they are applied.
        </p>
      </Section>

      <Section title="Guardians’ Free Spins (demo bonus)">
        <p>
          {SCATTERS_FOR_BONUS}+ Temple Gates open a cinematic transition and award {FREE_SPINS_AWARD} demo free
          spins. Before the round starts you choose one Guardian. The choice is a presentation choice: it changes
          the palette, the captions, the particle work and which cosmetic feature plays.
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {GUARDIANS.map((guardian) => (
            <div
              key={guardian.id}
              className="glass-panel gold-hairline flex flex-col items-center gap-2 rounded-2xl p-3 text-center"
              style={{ borderColor: `${guardian.colors.primary}44` }}
            >
              <GuardianEmblem guardian={guardian.id} size={56} />
              <p className="font-display text-sm" style={{ color: guardian.colors.primary }}>
                {guardian.title}
              </p>
              <p className="text-[11px] font-semibold text-gold-light">{guardian.feature}</p>
              <p className="text-[11px] leading-snug text-slate-400">{guardian.description}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          A Free Spins Remaining gauge, the chosen Guardian’s emblem and the virtual multiplier stay on screen for
          the whole round. It closes on a summary card with the total demo bonus win.
        </p>
      </Section>

      <Section title="Pick a Relic (rare mini-game)">
        <p>
          After a rare temple event the vault opens: twelve sealed relics, {RELIC_PICKS} picks, each opened with a
          3D flip. Rewards are demo multipliers, a wild expansion, extra free spins or a mystery reveal — some of
          them pre-arm the next demo round.
        </p>
      </Section>

      <Section title="Controls & accessibility">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Every control is reachable with Tab and activated with Enter or Space.</li>
          <li>
            Shortcuts: <kbd className="rounded bg-white/10 px-1.5">Space</kbd> spin,{' '}
            <kbd className="rounded bg-white/10 px-1.5">T</kbd> turbo,{' '}
            <kbd className="rounded bg-white/10 px-1.5">A</kbd> auto spin,{' '}
            <kbd className="rounded bg-white/10 px-1.5">+ / −</kbd> stake,{' '}
            <kbd className="rounded bg-white/10 px-1.5">I</kbd> info,{' '}
            <kbd className="rounded bg-white/10 px-1.5">P</kbd> paytable,{' '}
            <kbd className="rounded bg-white/10 px-1.5">H</kbd> history,{' '}
            <kbd className="rounded bg-white/10 px-1.5">M</kbd> sound,{' '}
            <kbd className="rounded bg-white/10 px-1.5">F</kbd> fullscreen.
          </li>
          <li>Auto Spin is capped at ten consecutive demo rounds and can be stopped instantly.</li>
          <li>Sound is synthesised in the browser and is off-switchable at any time.</li>
          <li>The heavier ambient animation respects your system’s “reduce motion” setting.</li>
        </ul>
      </Section>

      <Section title="Legal & scope">
        <p>
          This build contains no real-money gambling, no deposits, no withdrawals, no cryptocurrency, no wagering
          and no prizes of any kind. “Demo Credits”, “Demo Stake” and “Demo Win” are presentation counters used to
          demonstrate interface, animation and game-feel work. Nothing shown can be purchased, redeemed,
          transferred or exchanged.
        </p>
      </Section>
    </Modal>
  );
}
