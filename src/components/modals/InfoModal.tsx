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
    <Modal open={open} onClose={onClose} title="Game Info" eyebrow="Yokai Tea House">
      <div className="rounded-2xl border border-crimson-neon/40 bg-crimson-neon/10 px-4 py-3 text-sm text-[#FFC9D4]">
        <strong className="font-semibold">{DEMO_DISCLAIMER}</strong>
      </div>

      <Section title="The house">
        <p>
          A tea house on a road that most travellers only find once. It keeps its lamps lit past midnight,
          which is when the other customers arrive: an umbrella that never forgave being left in a shed, a fox
          who pays in leaves, a tanuki whose purse is always at home on the shelf. The house has one rule, and
          it is older than the house — serve every spirit who sits down.
        </p>
        <p>
          Yokai Tea House is a presentation build: a five-reel, three-row board on {PAYLINE_COUNT} fixed demo
          lines with tumbling wins and coin multipliers, made to show reel feel, feature staging and celebration
          design rather than any commercial maths.
        </p>
      </Section>

      <Section title="The three that matter">
        <div className="grid gap-3 sm:grid-cols-3">
          {specials.map((symbol) => (
            <div key={symbol.id} className="glass-flat gold-hairline flex gap-3 rounded-2xl p-3">
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
            <strong className="text-gold-light">The Koban</strong> substitutes for every symbol except the
            noren and the ofuda, and pays on its own line as the top symbol.
          </li>
          <li>
            <strong className="text-gold-light">The Noren</strong> pays from anywhere on the board.{' '}
            {SCATTERS_FOR_BONUS} of them part at once and the whole road comes in for the Midnight Service.
          </li>
          <li>
            <strong className="text-gold-light">The Ofuda</strong> stays sealed until the pot is poured, then
            every talisman on screen turns over to the same guest.
          </li>
        </ul>
      </Section>

      <Section title="Tumbling service">
        <p>
          Every winning combination is cleared away like finished cups. What sat above falls into the gaps,
          fresh service comes in from over the table, and the board pays again — as many times as it keeps
          hitting. A round can chain up to eight tumbles, and the counter above the table tracks the chain and
          the running demo total.
        </p>
      </Section>

      <Section title="Coin lanterns">
        <p>
          Coins settle onto the table carrying a demo multiplier. They ignore the paylines entirely and simply
          wait. If the round ends with any win at all, every coin on the table is swept to the centre, the values
          fuse into one multiplier and the whole round total is multiplied by it. Coins on a losing round do
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
          Coin values are visual demo values. Several coins on one round add together before they are applied.
        </p>
      </Section>

      <Section title="The Midnight Service (demo bonus)">
        <p>
          {SCATTERS_FOR_BONUS}+ noren part at once and the road comes in, awarding {FREE_SPINS_AWARD} demo
          rounds of service. Before it starts you seat one of the regulars at your table. The choice is a
          presentation choice: it changes the palette, the captions, the lantern light and which cosmetic favour
          plays.
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {GUARDIANS.map((guardian) => (
            <div
              key={guardian.id}
              className="glass-flat gold-hairline flex flex-col items-center gap-2 rounded-2xl p-3 text-center"
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
          A rounds-remaining gauge, the seated regular’s crest and the virtual multiplier stay on screen for the
          whole service. It closes on a summary card with the total demo takings.
        </p>
      </Section>

      <Section title="Pick a Parcel (rare mini-game)">
        <p>
          Now and then a guest leaves something behind: twelve wrapped parcels, {RELIC_PICKS} picks, each opened
          with a 3D flip. Rewards are demo multipliers, an expanding koban, extra rounds of service or a sealed
          reveal — some of them pre-arm the next demo round.
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
