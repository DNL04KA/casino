# Neon Temple: Guardians of Fortune

A premium **HTML5 slot-game demo** built as a portfolio piece for a game studio.
It showcases reel feel, feature staging, celebration design and UI craft for a
futuristic-temple video slot.

> **This is a non-monetary visual prototype. No real-money gambling, deposits,
> withdrawals, or prizes.**
>
> There is no wagering, no cash-in or cash-out, no cryptocurrency and no RTP
> model. “Demo Credits”, “Demo Stake” and “Demo Win” are presentation counters
> that exist purely to demonstrate interface, animation and game-feel work.
> Nothing in this build can be purchased, redeemed, transferred or exchanged.

---

## Quick start

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

`npm run dev` starts Vite on <http://localhost:5173>. `npm run build` type-checks
the project and emits a production bundle to `dist/`; `npm run preview` serves
that bundle locally.

Requires Node 18+.

---

## Deploying to Cloudflare

The demo is a pure static bundle — no server, no API, no database — so it ships
as a **Workers Static Assets** project: Cloudflare serves `dist/` directly and
there is no Worker script at all.

### Connected to Git (how this repo deploys)

The repository is connected to Cloudflare, so every push to `main` is built and
published automatically. The project settings are:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node version | 22 or newer |

`wrangler.toml` supplies everything else — the Worker name and the assets
directory. Pull requests get their own preview URLs.

> The Worker name in `wrangler.toml` must match the project Cloudflare created.
> If your project is not called `casino`, change `name` to match, otherwise the
> deploy will create a second Worker alongside it.

### From your machine

```bash
npm run cf:login
```

```bash
npm run deploy
```

`cf:login` is one-time. After that `npm run deploy` type-checks, builds and
uploads, printing the live URL. `npm run deploy:version` uploads a preview
version with its own URL without touching production, and `npm run deploy:dry`
validates the bundle and config without uploading anything. `npm run cf:whoami`
reports which account wrangler is signed in as.

### What ships with the build

| File | Purpose |
| --- | --- |
| `public/_headers` | Immutable caching for hashed assets, always-revalidate for the shell, plus `nosniff`, `Referrer-Policy` and a locked-down `Permissions-Policy` |
| `wrangler.toml` | Worker name, assets directory, and SPA fallback for unknown paths |

`X-Frame-Options` is deliberately **not** set so the demo can be embedded in an
iframe on a portfolio site. Add it to `public/_headers` if you would rather it
could not be framed.

---

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App shell | **React 18 + TypeScript + Vite** | Fast HMR, strict typing across the demo state machine |
| Reel stage | **Phaser 3** | Frame-accurate reel motion, masks, particles, camera shake |
| Styling | **Tailwind CSS** | Consistent design tokens for the glass/gold UI system |
| UI motion | **Framer Motion** | Overlay chaining, spring transitions, celebration beats |
| Art | Procedural Canvas 2D + SVG + CSS gradients | Every symbol, colossus, pillar and background layer is drawn at runtime — no third-party or licensed assets |
| Audio | Web Audio API | All cues are synthesised in the browser — no audio files at all |

---

## Project structure

```
src/
├─ App.tsx                  # Screen composition + overlay orchestration
├─ main.tsx                 # React entry
├─ index.css                # Design system, ambient keyframes, utilities
├─ audio/
│  └─ SoundEngine.ts        # Synthesised cues (spin, reel stop, wins, bonus…)
├─ components/
│  ├─ common/               # Modal, SymbolCanvas, GuardianEmblem
│  ├─ layout/               # TempleBackground, RunePillar, GuardianColossus, GameStage
│  ├─ modals/               # Game Info, Paytable, History
│  ├─ overlays/             # BigWin, RoundBanner, BonusIntro, FreeSpinsHud, PickRelic, Summary
│  ├─ screens/              # Preloader, IntroScreen
│  └─ ui/                   # TopBar, BottomBar, SpinButton, StatTile, icons
├─ data/                    # config, symbols, paylines, guardians, relics
├─ game/
│  ├─ PhaserGame.tsx        # Phaser mount/teardown
│  ├─ bus.ts                # Typed React ⇄ Phaser event bus
│  ├─ constants.ts          # Stage geometry
│  ├─ art/                  # Procedural symbol art (shared with the DOM UI)
│  └─ scenes/TempleScene.ts # Reels, win presentation, feature animations
├─ hooks/                   # useSlotMachine, useSound, useCountUp, …
├─ types/                   # Shared domain types
└─ utils/                   # spinEngine, rng, format, cn
```

---

## Demo state machine

`useSlotMachine` drives an explicit phase machine:

```
preload → intro → idle → spinning → result ┬→ bigWin ──────────┐
                                           ├→ bonusIntro → freeSpins → summary
                                           └→ pickRelic ───────┘
                                                                └→ idle
```

* **idle** — resting board, controls live.
* **spinning** — reels in motion; SPIN, stake changes and features are locked and
  the button explains why instead of silently ignoring the press.
* **result** — win lines cycle, the Demo Win counter ticks up.
* **bigWin** — Big / Mega / Epic celebration overlay.
* **bonusIntro** — Temple Gate cinematic, then the Guardian picker.
* **freeSpins** — 10 auto-played demo free spins with a persistent HUD.
* **pickRelic** — 12-relic mini-game, 3 picks, 3D flip reveals.
* **summary** — total demo bonus win, Continue returns to the base game.

Every asynchronous hand-off between React and Phaser goes through
`gameBus.wait(event, timeout)`, so a stalled renderer can never dead-lock the UI —
the round times out, resets the reels and reports it.

### One round, beat by beat

```
spin ─▶ reels stop ─▶ mystery runes reveal ─▶ wilds expand
     ─▶ ┌ orbs drop ─▶ lines pay ─▶ winners shatter ─▶ board refills ┐ ×N
        └──────────────────── while the board keeps paying ──────────┘
     ─▶ orbs fly to the centre and fuse into one multiplier
     ─▶ round total ─▶ celebration / feature / idle
```

The read-out that normally shows the game nameplate turns into a live counter
during a round: the tumble number, the running demo total and the fused orb
multiplier.

---

## Features

### Reels
* 5 × 3 board, 20 fixed demo lines, left-to-right evaluation.
* Inertia, easing, per-reel stagger, motion-blur textures at speed and a
  spring bounce on landing.
* Idle "breathing" micro-animation so the board never looks frozen.
* Scatter anticipation: reels slow down and glow when the gate is close.

### Tumbling wins
Every winning symbol shatters into particles. Survivors fall into the gaps,
fresh symbols drop in from above the frame and the board pays again — up to
eight links in a chain, each one a semitone higher than the last.

### Rune Orbs
Glowing orbs land on the board carrying ×2 up to ×500. They ignore the paylines
completely and simply wait. If the round ends with any win, every orb flies to
the centre, the values fuse into a single multiplier and the whole round total —
tumbles included — is multiplied by it. Orbs on a losing round do nothing. The
colour ladder (cyan → violet → gold → red) makes rarity readable at a glance.

### Guardian colossi
Two mirrored temple colossi stand in front of the pillars: original armoured
deity art built entirely from SVG, re-tinted by the active Guardian. They float,
their visors pulse, and during a celebration they channel energy at the reels.

### Symbols
* **High pay** — Jade Dragon, Warden Mask, Night Empress, Golden Tiger.
* **Low pay** — A, K, Q, J, 10 as neon temple sigils.
* **Celestial Wild** — golden amulet, substitutes for all regular symbols.
* **Temple Gate (Scatter)** — 3+ open the bonus round.
* **Mystery Rune** — resolves into a single high-pay symbol once the reels settle.

All twelve are drawn procedurally by `src/game/art/` — the *same* routine feeds
the Phaser reel textures and the React paytable cards.

Symbols are rendered as free-standing **objects**, not icons in frames. Three
primitives do the work: `sculpt()` turns a flat path into a lit solid (drop
shadow, graded body, bottom-right occlusion, top-left sheen, fading rim light),
`cutGem()` renders a brilliant-cut stone with crown facets and a table, and
`embossText()` presses a letterform into metal. The royals are cut stones in gold
settings; the guardians are sculpted gold and jade with gem inlays. A coloured
bloom and a contact shadow are what separate each object from the reel behind
it.

### Guardians’ Free Spins
10 demo free spins. Before the round you pick one of three Guardians; the pick is
a **presentation** choice that changes palette, captions, particles and which
cosmetic feature plays:

| Guardian | Style | Cosmetic feature |
| --- | --- | --- |
| **Vireth**, Dragon Guardian | Blue/gold fire | Expanding Celestial Wild |
| **Kaoren**, Tiger Guardian | Molten red flashes | Rising demo multiplier (up to ×5) |
| **Suyen**, Moon Guardian | Violet moonlight | Mystery rune cascade |

### Pick a Relic
Triggered by a rare temple event. Twelve sealed relics, three picks, 3D flip
reveals, dimmed room, heartbeat cue, spotlight and gold dust. Rewards can pre-arm
the next demo round (wild expansion, mystery cascade, extra free spins).

### Presentation director
`src/utils/spinEngine.ts` contains a small, clearly-labelled **demo pacing
director**. A portfolio build has to show its features quickly, so it
occasionally scripts a near-miss, a big win or a bonus trigger. It is explicitly
a presentation device — not a payout model.

Measured over 20 000 scripted rounds, the demo settles at roughly 57 % winning
spins, a bonus about every 27 rounds, the relic hunt about every 54, and a
Big/Mega/Epic celebration on about 6 % of rounds. Those figures describe the
*pacing of the showcase*, nothing else — there is no RTP, no wagering model and
nothing at stake.

---

## Performance

The shell picks a rendering tier on first load from `hardwareConcurrency`,
`deviceMemory`, pointer type and screen size, and remembers your choice after
that. The gauge button in the top bar cycles it:

| Tier | What it costs |
| --- | --- |
| **High detail** | Everything: ambient embers, drifting cloud bank, distant lightning, light shafts and runes behind the reels, blurred glass panels |
| **Balanced** | Fewer embers, no `backdrop-filter`, no stage extras |
| **Performance** | No ambient scenery at all — just the game |

The reels, the win beat and every feature animation are identical on all three;
only mood is traded. Touch devices and anything with four cores or less start
below High, because a demo that stutters on first contact never gets a second
look.

Add `#fps` to the URL for a frame-rate readout (current fps and the worst frame
time in the last half second), which is the quickest way to check a real device.

---

## Controls

| Input | Action |
| --- | --- |
| `Space` / `Enter` | Spin (or stop Auto Spin) |
| `T` | Turbo |
| `A` | Auto Spin (max 10, stoppable at any time) |
| `+` / `−` / `↑` / `↓` | Demo stake |
| `I` / `P` / `H` | Info / Paytable / History |
| `M` | Sound |
| `F` | Fullscreen |
| `Tab` / `Shift+Tab` | Move between controls |
| `Esc` | Close a dialog |

---

## Accessibility

* Every control is a real `<button>` with an `aria-label`, hover, focus-visible,
  pressed and disabled states.
* Dialogs are `role="dialog" aria-modal`, trap Tab, close on `Esc` and restore
  focus to the trigger.
* Win, bonus and notice layers are `role="status" aria-live="polite"`.
* Palette holds contrast against the dark background; focus rings use neon cyan.
* Heavy ambient animation is disabled under `prefers-reduced-motion: reduce`.

---

## Design system

| Token | Value |
| --- | --- |
| Background | `#08111F` / `#130B2C` |
| Neon cyan | `#25D9FF` |
| Violet | `#8A4DFF` |
| Gold | `#F8C65B` (light `#FFE9AE`, deep `#C8912B`) |
| Emerald | `#28D6A0` |
| Accent red | `#FF4D6D` |

Type: **Sora** (geometric sans, UI), **Chakra Petch** (tabular numerics),
**Cinzel Decorative** (display, headings and the wordmark only).

Layout: 16:9 desktop, tablet, and mobile portrait. The reel stage keeps a 12:7
frame and scales with `Phaser.Scale.FIT`; the decorative pillars retire below the
`lg` breakpoint so the reels stay the focus.

---

## Licensing note

All artwork, symbol designs, guardian characters, wordmark, layout and audio in
this repository are original and generated at runtime from code in this project.
No third-party game assets, brands, characters or interfaces are copied or
referenced.
