import Phaser from 'phaser';
import { GRID_COLUMNS, GRID_ROWS, TIMING } from '@/data/config';
import { SYMBOLS, getSymbol } from '@/data/symbols';
import { GUARDIAN_MAP } from '@/data/guardians';
import type { Cell, Grid, GuardianId, LineWin, OrbDrop, SymbolId } from '@/types';
import {
  drawOrb,
  drawShockRing,
  drawSoftDot,
  drawSparkle,
  drawSymbolTile,
  drawWinHalo,
} from '@/game/art/drawSymbol';
import { gameBus, type GameEvents } from '@/game/bus';
import {
  CELL_HEIGHT,
  CELL_WIDTH,
  GRID_HEIGHT,
  GRID_WIDTH,
  ORIGIN_X,
  ORIGIN_Y,
  REEL_ANTICIPATION_SPEED,
  REEL_MAX_SPEED,
  REEL_SLOTS,
  TILE_DISPLAY_SIZE,
  TILE_TEXTURE_SIZE,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  cellX,
  cellY,
} from '@/game/constants';

type ReelMode = 'idle' | 'spin' | 'stop' | 'land';

interface ReelRuntime {
  index: number;
  symbols: SymbolId[];
  sprites: Phaser.GameObjects.Image[];
  offset: number;
  speed: number;
  targetSpeed: number;
  mode: ReelMode;
  queue: SymbolId[];
  bounce: number;
  anticipating: boolean;
  glow: Phaser.GameObjects.Rectangle | null;
}

const FILLERS: SymbolId[] = ['dragon', 'mask', 'empress', 'tiger', 'ace', 'king', 'queen', 'jack', 'ten', 'wild'];

const texKey = (id: SymbolId) => `sym-${id}`;
const blurKey = (id: SymbolId) => `symblur-${id}`;

interface LiveOrb {
  id: string;
  value: number;
  container: Phaser.GameObjects.Container;
}

/** Orb colour rises with its face value, so rarity is readable at a glance. */
function orbTint(value: number): number {
  if (value >= 100) return 0xff4d6d;
  if (value >= 25) return 0xf8c65b;
  if (value >= 10) return 0x8a4dff;
  return 0x25d9ff;
}

export class TempleScene extends Phaser.Scene {
  private reels: ReelRuntime[] = [];
  private tileScale = TILE_DISPLAY_SIZE / TILE_TEXTURE_SIZE;

  private lineGfx!: Phaser.GameObjects.Graphics;
  private arcGfx!: Phaser.GameObjects.Graphics;
  private beamGfx!: Phaser.GameObjects.Graphics;
  private haloLayer!: Phaser.GameObjects.Container;
  private orbLayer!: Phaser.GameObjects.Container;
  private orbs: LiveOrb[] = [];
  private reelMask!: Phaser.Display.Masks.GeometryMask;

  private emitters: Record<string, Phaser.GameObjects.Particles.ParticleEmitter> = {};
  private dust?: Phaser.GameObjects.Particles.ParticleEmitter;

  private activeWins: LineWin[] = [];
  private activeIndex = 0;
  private activeCells: Cell[] = [];
  private activeColor = 0xf8c65b;
  private winTimer?: Phaser.Time.TimerEvent;
  private halos: Phaser.GameObjects.Image[] = [];
  /** One-shot flashes and rings, cleared with the rest of the win layer. */
  private effects: Phaser.GameObjects.Image[] = [];

  private stoppedCount = 0;
  private spinning = false;
  /** Wins requested while the reels were still moving, applied once they land. */
  private pendingWins: { wins: LineWin[]; turbo: boolean } | null = null;
  private themeColor = 0x25d9ff;
  /** Suspends the idle "breathing" loop while a feature animation owns the sprites. */
  private idleLocked = false;
  private unsubscribers: Array<() => void> = [];
  /** False once the scene is torn down, so stale bus events are ignored. */
  private alive = true;

  constructor() {
    super('TempleScene');
  }

  /* ------------------------------------------------------------------ */
  /*  Boot                                                               */
  /* ------------------------------------------------------------------ */

  create(): void {
    this.buildTextures();
    this.buildReels();
    this.buildLayers();
    this.buildEmitters();
    this.bindBus();

    const teardown = () => {
      this.alive = false;
      this.unsubscribers.forEach((off) => off());
      this.unsubscribers = [];
    };
    // A destroyed game must stop reacting to the shared bus, otherwise a
    // remount (StrictMode, HMR) leaves dead sprites listening.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, teardown);
    this.events.once(Phaser.Scenes.Events.DESTROY, teardown);

    gameBus.emit('scene:ready', {});
  }

  private makeCanvasTexture(key: string, size: number, paint: (ctx: CanvasRenderingContext2D) => void): void {
    if (this.textures.exists(key)) return;
    const texture = this.textures.createCanvas(key, size, size);
    if (!texture) return;
    const ctx = texture.getContext();
    if (!ctx) return;
    paint(ctx);
    texture.refresh();
  }

  private buildTextures(): void {
    for (const def of SYMBOLS) {
      this.makeCanvasTexture(texKey(def.id), TILE_TEXTURE_SIZE, (ctx) => {
        drawSymbolTile(ctx, def.id, TILE_TEXTURE_SIZE);
      });

      // Motion-blur variant, swapped in while the reel is at speed.
      this.makeCanvasTexture(blurKey(def.id), TILE_TEXTURE_SIZE, (ctx) => {
        const supportsFilter = 'filter' in ctx;
        if (supportsFilter) {
          ctx.save();
          ctx.filter = 'blur(6px)';
        }
        for (let i = -2; i <= 2; i += 1) {
          ctx.save();
          ctx.globalAlpha = i === 0 ? 0.75 : 0.22;
          ctx.translate(0, i * 7);
          drawSymbolTile(ctx, def.id, TILE_TEXTURE_SIZE, { clear: false });
          ctx.restore();
        }
        if (supportsFilter) ctx.restore();
      });
    }

    this.makeCanvasTexture('fx-dot', 64, (ctx) => drawSoftDot(ctx, 64));
    this.makeCanvasTexture('fx-star', 48, (ctx) => drawSparkle(ctx, 48));
    this.makeCanvasTexture('fx-halo', 240, (ctx) => drawWinHalo(ctx, 240, '#F8C65B'));
    this.makeCanvasTexture('fx-orb', 160, (ctx) => drawOrb(ctx, 160));
    this.makeCanvasTexture('fx-ring', 256, (ctx) => drawShockRing(ctx, 256));
  }

  private buildReels(): void {
    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(ORIGIN_X - 6, ORIGIN_Y - 4, GRID_WIDTH + 12, GRID_HEIGHT + 8, 18);
    const mask = maskShape.createGeometryMask();
    this.reelMask = mask;

    for (let index = 0; index < GRID_COLUMNS; index += 1) {
      const symbols: SymbolId[] = Array.from({ length: REEL_SLOTS }, () => this.randomSymbol());
      const sprites: Phaser.GameObjects.Image[] = [];

      for (let slot = 0; slot < REEL_SLOTS; slot += 1) {
        const sprite = this.add
          .image(cellX(index), ORIGIN_Y + (slot - 1) * CELL_HEIGHT + CELL_HEIGHT / 2, texKey(symbols[slot]))
          .setScale(this.tileScale);
        sprite.setMask(mask);
        sprites.push(sprite);
      }

      this.reels.push({
        index,
        symbols,
        sprites,
        offset: 0,
        speed: 0,
        targetSpeed: 0,
        mode: 'idle',
        queue: [],
        bounce: 0,
        anticipating: false,
        glow: null,
      });
    }
  }

  private buildLayers(): void {
    this.beamGfx = this.add.graphics().setDepth(6);
    this.lineGfx = this.add.graphics().setDepth(8);
    this.arcGfx = this.add.graphics().setDepth(9);
    this.haloLayer = this.add.container(0, 0).setDepth(7);
    this.orbLayer = this.add.container(0, 0).setDepth(14);
  }

  private buildEmitters(): void {
    const palette: Record<string, number> = {
      gold: 0xf8c65b,
      violet: 0x8a4dff,
      cyan: 0x25d9ff,
      crimson: 0xff4d6d,
    };

    for (const [name, tint] of Object.entries(palette)) {
      const emitter = this.add.particles(0, 0, 'fx-star', {
        lifespan: { min: 500, max: 1100 },
        speed: { min: 90, max: 330 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.55, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 220,
        blendMode: 'ADD',
        tint,
        emitting: false,
      });
      emitter.setDepth(12);
      this.emitters[name] = emitter;
    }

    this.dust = this.add.particles(0, 0, 'fx-dot', {
      x: { min: 0, max: VIEW_WIDTH },
      y: VIEW_HEIGHT + 20,
      lifespan: { min: 5200, max: 9000 },
      speedY: { min: -34, max: -12 },
      speedX: { min: -14, max: 14 },
      scale: { start: 0.22, end: 0 },
      alpha: { start: 0.5, end: 0 },
      quantity: 1,
      frequency: 420,
      blendMode: 'ADD',
      tint: [0xf8c65b, 0x25d9ff, 0x8a4dff],
    });
    this.dust.setDepth(2);
  }

  /** Subscribes to the bus and drops the event if this scene is already gone. */
  private listen<K extends keyof GameEvents>(event: K, handler: (payload: GameEvents[K]) => void): () => void {
    return gameBus.on(event, (payload) => {
      if (!this.alive) return;
      handler(payload);
    });
  }

  private bindBus(): void {
    this.alive = true;
    this.unsubscribers.push(
      this.listen('reels:set', ({ grid }) => this.setGrid(grid)),
      this.listen('reels:spin', ({ grid, turbo, anticipationReels }) => this.startSpin(grid, turbo, anticipationReels)),
      this.listen('wins:show', ({ wins, turbo }) => this.showWins(wins, turbo)),
      this.listen('wins:clear', () => this.clearWins()),
      this.listen('mystery:reveal', ({ cells, symbol, turbo }) => this.revealMystery(cells, symbol, turbo)),
      this.listen('wild:expand', ({ reels, turbo }) => this.expandWilds(reels, turbo)),
      this.listen('fx:burst', ({ kind, strength }) => this.burstAtCentre(kind, strength ?? 1)),
      this.listen('fx:shake', ({ intensity, duration }) => this.cameras.main.shake(duration, intensity)),
      this.listen('theme:set', ({ guardian }) => this.applyTheme(guardian)),
      this.listen('scatter:hit', ({ index }) => this.scatterPulse(index)),
      this.listen('tumble:clear', ({ cleared, next, turbo }) => this.tumbleClear(cleared, next, turbo)),
      this.listen('orbs:drop', ({ orbs, turbo }) => this.dropOrbs(orbs, turbo)),
      this.listen('orbs:collect', ({ total, turbo }) => this.collectOrbs(total, turbo)),
      this.listen('orbs:clear', () => this.clearOrbs()),
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Reel motion                                                        */
  /* ------------------------------------------------------------------ */

  private randomSymbol(): SymbolId {
    return FILLERS[Math.floor(Math.random() * FILLERS.length)] as SymbolId;
  }

  private setGrid(grid: Grid): void {
    this.clearWins();
    for (let reel = 0; reel < GRID_COLUMNS; reel += 1) {
      const runtime = this.reels[reel] as ReelRuntime;
      runtime.symbols[0] = this.randomSymbol();
      for (let row = 0; row < GRID_ROWS; row += 1) {
        runtime.symbols[row + 1] = grid[reel][row] as SymbolId;
      }
      runtime.symbols[REEL_SLOTS - 1] = this.randomSymbol();
      for (let slot = 0; slot < REEL_SLOTS; slot += 1) {
        const sprite = runtime.sprites[slot] as Phaser.GameObjects.Image;
        this.tweens.killTweensOf(sprite);
        sprite.setAlpha(1).setScale(this.tileScale);
        sprite.y = ORIGIN_Y + (slot - 1) * CELL_HEIGHT + CELL_HEIGHT / 2;
      }
      runtime.offset = 0;
      runtime.bounce = 0;
      runtime.mode = 'idle';
      runtime.speed = 0;
      this.spinning = false;
      this.paintReel(runtime, false);
    }
  }

  private paintReel(reel: ReelRuntime, blurred: boolean): void {
    for (let slot = 0; slot < REEL_SLOTS; slot += 1) {
      const id = reel.symbols[slot] as SymbolId;
      const key = blurred ? blurKey(id) : texKey(id);
      const sprite = reel.sprites[slot] as Phaser.GameObjects.Image;
      if (sprite.texture.key !== key) sprite.setTexture(key);
    }
  }

  private startSpin(grid: Grid, turbo: boolean, anticipationReels: number[]): void {
    if (this.spinning) return;
    this.clearWins();
    this.clearOrbs();
    this.pendingWins = null;
    this.spinning = true;
    this.stoppedCount = 0;

    const timing = turbo ? TIMING.turbo : TIMING.normal;
    const speed = REEL_MAX_SPEED * (turbo ? 1.45 : 1);

    this.reels.forEach((reel, index) => {
      reel.mode = 'spin';
      reel.queue = [];
      reel.bounce = 0;
      reel.anticipating = false;
      reel.targetSpeed = speed + index * 0.12;
      this.hideReelGlow(reel);
    });

    let delay = timing.firstReelStop;
    this.reels.forEach((reel, index) => {
      const anticipates = anticipationReels.includes(index);
      if (anticipates) delay += timing.anticipationExtra;
      const stopAt = delay;
      this.time.delayedCall(stopAt, () => this.requestStop(index, grid[index] as SymbolId[]));
      if (anticipates) {
        this.time.delayedCall(Math.max(0, stopAt - timing.anticipationExtra), () => {
          reel.anticipating = true;
          reel.targetSpeed = REEL_ANTICIPATION_SPEED;
          this.showReelGlow(reel);
        });
      }
      delay += timing.reelStopStep;
    });
  }

  private requestStop(index: number, finalColumn: SymbolId[]): void {
    const reel = this.reels[index] as ReelRuntime;
    if (reel.mode !== 'spin') return;
    reel.mode = 'stop';
    reel.queue = [
      finalColumn[2] as SymbolId,
      finalColumn[1] as SymbolId,
      finalColumn[0] as SymbolId,
      this.randomSymbol(),
    ];
  }

  private landReel(reel: ReelRuntime): void {
    reel.mode = 'land';
    reel.speed = 0;
    reel.offset = 0;
    reel.anticipating = false;
    this.hideReelGlow(reel);
    this.paintReel(reel, false);

    const overshoot = 26;
    reel.bounce = overshoot;
    this.tweens.addCounter({
      from: overshoot,
      to: 0,
      duration: 380,
      ease: 'Back.easeOut',
      onUpdate: (tween) => {
        reel.bounce = tween.getValue() ?? 0;
      },
      onComplete: () => {
        reel.bounce = 0;
      },
    });

    gameBus.emit('reels:stopped', { reel: reel.index });

    this.stoppedCount += 1;
    if (this.stoppedCount >= GRID_COLUMNS) {
      this.spinning = false;
      this.time.delayedCall(120, () => {
        gameBus.emit('reels:complete', {});
        const pending = this.pendingWins;
        if (pending) {
          this.pendingWins = null;
          this.showWins(pending.wins, pending.turbo);
        }
      });
    }
  }

  private showReelGlow(reel: ReelRuntime): void {
    if (reel.glow) return;
    const rect = this.add
      .rectangle(cellX(reel.index), ORIGIN_Y + GRID_HEIGHT / 2, CELL_WIDTH - 6, GRID_HEIGHT, this.themeColor, 0.14)
      .setDepth(5)
      .setBlendMode(Phaser.BlendModes.ADD);
    reel.glow = rect;
    this.tweens.add({ targets: rect, alpha: { from: 0.08, to: 0.32 }, duration: 320, yoyo: true, repeat: -1 });
  }

  private hideReelGlow(reel: ReelRuntime): void {
    if (!reel.glow) return;
    this.tweens.killTweensOf(reel.glow);
    reel.glow.destroy();
    reel.glow = null;
  }

  update(time: number, delta: number): void {
    for (const reel of this.reels) {
      this.advanceReel(reel, time, delta);
    }
    this.drawArcs(time);
  }

  private advanceReel(reel: ReelRuntime, time: number, delta: number): void {
    if (reel.mode === 'idle' || reel.mode === 'land') {
      // Idle micro-animation: a slow breath so the board never feels frozen.
      for (let slot = 1; slot <= GRID_ROWS; slot += 1) {
        const sprite = reel.sprites[slot] as Phaser.GameObjects.Image;
        const phase = time * 0.0016 + reel.index * 0.7 + slot * 0.9;
        if (this.idleLocked) {
          sprite.y = cellY(slot - 1) + reel.bounce;
          continue;
        }
        const breathe = 1 + Math.sin(phase) * 0.012;
        sprite.setScale(this.tileScale * breathe);
        sprite.y = cellY(slot - 1) + reel.bounce + Math.sin(phase) * 1.6;
      }
      const above = reel.sprites[0] as Phaser.GameObjects.Image;
      above.y = ORIGIN_Y - CELL_HEIGHT / 2 + reel.bounce;
      const below = reel.sprites[REEL_SLOTS - 1] as Phaser.GameObjects.Image;
      below.y = ORIGIN_Y + GRID_HEIGHT + CELL_HEIGHT / 2 + reel.bounce;
      return;
    }

    const blend = Math.min(1, delta / 140);
    reel.speed += (reel.targetSpeed - reel.speed) * blend;
    reel.offset += reel.speed * delta;

    let guard = 0;
    while (reel.offset >= CELL_HEIGHT && guard < 16) {
      guard += 1;
      reel.offset -= CELL_HEIGHT;
      reel.symbols.pop();
      let next: SymbolId;
      if (reel.mode === 'stop' && reel.queue.length > 0) {
        next = reel.queue.shift() as SymbolId;
      } else {
        next = this.randomSymbol();
      }
      reel.symbols.unshift(next);

      if (reel.mode === 'stop' && reel.queue.length === 0) {
        this.paintReel(reel, false);
        this.landReel(reel);
        return;
      }
    }

    this.paintReel(reel, reel.speed > 0.9);
    for (let slot = 0; slot < REEL_SLOTS; slot += 1) {
      const sprite = reel.sprites[slot] as Phaser.GameObjects.Image;
      sprite.y = ORIGIN_Y + (slot - 1) * CELL_HEIGHT + CELL_HEIGHT / 2 + reel.offset;
      const stretch = 1 + Math.min(0.16, reel.speed * 0.045);
      sprite.setScale(this.tileScale, this.tileScale * stretch);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Win presentation                                                   */
  /* ------------------------------------------------------------------ */

  private showWins(wins: LineWin[], turbo: boolean): void {
    if (this.spinning) {
      // The round resolved before the stage caught up (throttled tab, slow
      // frame budget). Hold the wins and play them the moment the reels land.
      this.pendingWins = { wins, turbo };
      return;
    }
    this.clearWins();
    if (wins.length === 0) return;
    this.activeWins = wins;
    this.activeIndex = 0;
    this.idleLocked = true;
    this.dimBoard(true);
    this.presentWin(0);

    const cycle = turbo ? TIMING.turbo.winCycle : TIMING.normal.winCycle;
    if (wins.length > 1) {
      this.winTimer = this.time.addEvent({
        delay: cycle,
        loop: true,
        callback: () => {
          this.activeIndex = (this.activeIndex + 1) % this.activeWins.length;
          this.presentWin(this.activeIndex);
        },
      });
    }
  }

  private presentWin(index: number): void {
    const win = this.activeWins[index];
    if (!win) return;

    this.clearHalos();
    this.lineGfx.clear();

    const def = getSymbol(win.symbol);
    const color = Phaser.Display.Color.HexStringToColor(def.palette.glow).color;
    this.activeColor = color;
    this.activeCells = win.cells;

    // Restore full brightness on the winning cells only.
    win.cells.forEach(([reel, row], order) => {
      const sprite = (this.reels[reel] as ReelRuntime).sprites[row + 1] as Phaser.GameObjects.Image;
      const x = cellX(reel);
      const y = cellY(row);
      sprite.setAlpha(1);

      // Impact: a hard punch that settles into a slow breath.
      this.tweens.chain({
        targets: sprite,
        tweens: [
          { scale: this.tileScale * 1.3, duration: 150, ease: 'Back.easeOut', delay: order * 45 },
          {
            scale: this.tileScale * 1.1,
            duration: 420,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          },
        ],
      });

      // Silhouette flash, additive, gone in a blink.
      const flash = this.add
        .image(x, y, sprite.texture.key)
        .setScale(this.tileScale)
        .setTintFill(0xffffff)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(10)
        .setAlpha(0);
      this.effects.push(flash);
      this.tweens.add({
        targets: flash,
        alpha: { from: 0.85, to: 0 },
        scale: this.tileScale * 1.35,
        duration: 320,
        delay: order * 45,
        ease: 'Quad.easeOut',
      });

      // Shockwave ring.
      const ring = this.add
        .image(x, y, 'fx-ring')
        .setTint(color)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(11)
        .setScale(0.18)
        .setAlpha(0);
      this.effects.push(ring);
      this.tweens.add({
        targets: ring,
        scale: 1.05,
        alpha: { from: 0.9, to: 0 },
        duration: 560,
        delay: order * 45,
        ease: 'Cubic.easeOut',
      });

      const halo = this.add
        .image(x, y, 'fx-halo')
        .setTint(color)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(TILE_DISPLAY_SIZE / 240)
        .setAlpha(0.9);
      this.haloLayer.add(halo);
      this.halos.push(halo);
      this.tweens.add({
        targets: halo,
        alpha: { from: 0.35, to: 0.95 },
        scale: { from: TILE_DISPLAY_SIZE / 240, to: (TILE_DISPLAY_SIZE / 240) * 1.1 },
        duration: 460,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.emitters.gold?.setParticleTint(color);
      this.emitters.gold?.explode(12, x, y);
    });

    // Payline ribbon
    if (win.lineId !== 0) {
      this.lineGfx.lineStyle(6, color, 0.28);
      this.lineGfx.beginPath();
      win.cells.forEach(([reel, row], i) => {
        const x = cellX(reel);
        const y = cellY(row);
        if (i === 0) this.lineGfx.moveTo(x, y);
        else this.lineGfx.lineTo(x, y);
      });
      this.lineGfx.strokePath();
    }
  }

  /** Electric arcs redrawn every frame between the symbols of the active line. */
  private drawArcs(time: number): void {
    this.arcGfx.clear();
    if (this.activeCells.length < 2) return;

    const flicker = 0.45 + Math.sin(time * 0.02) * 0.25;
    this.arcGfx.lineStyle(2.5, this.activeColor, flicker);

    for (let i = 0; i < this.activeCells.length - 1; i += 1) {
      const [r1, w1] = this.activeCells[i] as Cell;
      const [r2, w2] = this.activeCells[i + 1] as Cell;
      const x1 = cellX(r1);
      const y1 = cellY(w1);
      const x2 = cellX(r2);
      const y2 = cellY(w2);
      const segments = 8;

      this.arcGfx.beginPath();
      this.arcGfx.moveTo(x1, y1);
      for (let s = 1; s < segments; s += 1) {
        const t = s / segments;
        const nx = Phaser.Math.Linear(x1, x2, t);
        const ny = Phaser.Math.Linear(y1, y2, t);
        const jitter = (Math.random() - 0.5) * 26;
        this.arcGfx.lineTo(nx, ny + jitter);
      }
      this.arcGfx.lineTo(x2, y2);
      this.arcGfx.strokePath();
    }
  }

  private dimBoard(dim: boolean): void {
    for (const reel of this.reels) {
      for (let slot = 1; slot <= GRID_ROWS; slot += 1) {
        const sprite = reel.sprites[slot] as Phaser.GameObjects.Image;
        sprite.setAlpha(dim ? 0.4 : 1);
      }
    }
  }

  private clearHalos(): void {
    this.halos.forEach((halo) => {
      this.tweens.killTweensOf(halo);
      halo.destroy();
    });
    this.halos = [];
    this.effects.forEach((fx) => {
      this.tweens.killTweensOf(fx);
      fx.destroy();
    });
    this.effects = [];
    for (const reel of this.reels) {
      for (let slot = 1; slot <= GRID_ROWS; slot += 1) {
        const sprite = reel.sprites[slot] as Phaser.GameObjects.Image;
        this.tweens.killTweensOf(sprite);
        sprite.setScale(this.tileScale);
      }
    }
  }

  private clearWins(): void {
    this.winTimer?.remove();
    this.winTimer = undefined;
    this.activeWins = [];
    this.activeCells = [];
    this.idleLocked = false;
    this.clearHalos();
    this.lineGfx.clear();
    this.arcGfx.clear();
    this.dimBoard(false);
  }

  /* ------------------------------------------------------------------ */
  /*  Feature animations                                                 */
  /* ------------------------------------------------------------------ */

  private revealMystery(cells: Cell[], symbol: SymbolId, turbo: boolean): void {
    this.idleLocked = true;
    const flip = turbo ? 150 : 320;
    const step = turbo ? 40 : 90;

    cells.forEach(([reel, row], i) => {
      const sprite = (this.reels[reel] as ReelRuntime).sprites[row + 1] as Phaser.GameObjects.Image;
      (this.reels[reel] as ReelRuntime).symbols[row + 1] = symbol;
      this.emitters.violet?.explode(10, cellX(reel), cellY(row));

      this.tweens.add({
        targets: sprite,
        scaleX: 0,
        duration: flip,
        delay: i * step,
        ease: 'Quad.easeIn',
        onComplete: () => {
          sprite.setTexture(texKey(symbol));
          this.tweens.add({
            targets: sprite,
            scaleX: this.tileScale,
            duration: flip,
            ease: 'Back.easeOut',
          });
        },
      });
    });

    const total = flip * 2 + cells.length * step + 120;
    this.time.delayedCall(total, () => {
      if (this.activeWins.length === 0) this.idleLocked = false;
      gameBus.emit('mystery:done', {});
    });
  }

  private expandWilds(reels: number[], turbo: boolean): void {
    this.idleLocked = true;
    const duration = turbo ? 220 : 480;

    reels.forEach((reelIndex, i) => {
      const reel = this.reels[reelIndex] as ReelRuntime;
      this.time.delayedCall(i * (turbo ? 70 : 150), () => {
        this.beamGfx.fillStyle(0xffe9ae, 0.35);
        this.beamGfx.fillRect(cellX(reelIndex) - CELL_WIDTH / 2, ORIGIN_Y, CELL_WIDTH, GRID_HEIGHT);
        this.tweens.addCounter({
          from: 0.45,
          to: 0,
          duration,
          onUpdate: (tween) => {
            this.beamGfx.clear();
            this.beamGfx.fillStyle(0xffe9ae, tween.getValue() ?? 0);
            this.beamGfx.fillRect(cellX(reelIndex) - CELL_WIDTH / 2, ORIGIN_Y, CELL_WIDTH, GRID_HEIGHT);
          },
          onComplete: () => this.beamGfx.clear(),
        });

        for (let row = 0; row < GRID_ROWS; row += 1) {
          reel.symbols[row + 1] = 'wild';
          const sprite = reel.sprites[row + 1] as Phaser.GameObjects.Image;
          sprite.setTexture(texKey('wild'));
          this.tweens.add({
            targets: sprite,
            scale: { from: this.tileScale * 1.25, to: this.tileScale },
            duration,
            ease: 'Back.easeOut',
          });
        }
        this.emitters.gold?.setParticleTint(0xf8c65b);
        this.emitters.gold?.explode(18, cellX(reelIndex), ORIGIN_Y + GRID_HEIGHT / 2);
      });
    });

    const total = reels.length * (turbo ? 70 : 150) + duration + 120;
    this.time.delayedCall(total, () => {
      if (this.activeWins.length === 0) this.idleLocked = false;
      gameBus.emit('wild:done', {});
    });
  }

  private scatterPulse(index: number): void {
    const reel = this.reels[index];
    if (!reel) return;
    this.emitters.cyan?.explode(14, cellX(index), ORIGIN_Y + GRID_HEIGHT / 2);
  }

  private burstAtCentre(kind: 'gold' | 'violet' | 'cyan' | 'crimson', strength: number): void {
    const emitter = this.emitters[kind];
    if (!emitter) return;
    const count = Math.round(24 * strength);
    for (let i = 0; i < 4; i += 1) {
      this.time.delayedCall(i * 110, () => {
        emitter.explode(
          count,
          ORIGIN_X + Math.random() * GRID_WIDTH,
          ORIGIN_Y + Math.random() * GRID_HEIGHT,
        );
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Tumbles                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Winning symbols shatter, the survivors above them fall into the gaps and
   * fresh symbols drop in from over the top of the frame.
   */
  private tumbleClear(cleared: Cell[], next: Grid, turbo: boolean): void {
    this.idleLocked = true;
    const shatter = turbo ? 140 : 300;
    const fall = turbo ? 200 : 420;

    const clearedByReel = new Map<number, Set<number>>();
    for (const [reel, row] of cleared) {
      const rows = clearedByReel.get(reel) ?? new Set<number>();
      rows.add(row);
      clearedByReel.set(reel, rows);
    }

    // 1 — shatter the winning symbols
    for (const [reel, row] of cleared) {
      const sprite = (this.reels[reel] as ReelRuntime).sprites[row + 1] as Phaser.GameObjects.Image;
      this.tweens.killTweensOf(sprite);
      this.emitters.gold?.setParticleTint(this.activeColor);
      this.emitters.gold?.explode(14, cellX(reel), cellY(row));
      this.tweens.add({
        targets: sprite,
        scale: this.tileScale * 1.35,
        alpha: 0,
        angle: Phaser.Math.Between(-16, 16),
        duration: shatter,
        ease: 'Quad.easeIn',
      });
    }

    // 2 — drop everything that survived, and refill from above
    this.time.delayedCall(shatter + 30, () => {
      const temporaries: Phaser.GameObjects.Image[] = [];

      for (let reel = 0; reel < GRID_COLUMNS; reel += 1) {
        const rows = clearedByReel.get(reel);
        if (!rows || rows.size === 0) continue;

        const survivors: number[] = [];
        for (let row = 0; row < GRID_ROWS; row += 1) if (!rows.has(row)) survivors.push(row);
        const gap = GRID_ROWS - survivors.length;

        survivors.forEach((row, i) => {
          const targetRow = gap + i;
          if (targetRow === row) return;
          const sprite = (this.reels[reel] as ReelRuntime).sprites[row + 1] as Phaser.GameObjects.Image;
          this.tweens.add({
            targets: sprite,
            y: cellY(targetRow),
            duration: fall,
            ease: 'Back.easeOut',
          });
        });

        for (let i = 0; i < gap; i += 1) {
          const incoming = this.add
            .image(cellX(reel), cellY(i) - (gap - i + 0.6) * CELL_HEIGHT, texKey(next[reel][i] as SymbolId))
            .setScale(this.tileScale)
            .setDepth(4);
          incoming.setMask(this.reelMask);
          temporaries.push(incoming);
          this.tweens.add({
            targets: incoming,
            y: cellY(i),
            duration: fall,
            delay: i * (turbo ? 20 : 55),
            ease: 'Back.easeOut',
          });
        }
      }

      this.time.delayedCall(fall + (turbo ? 60 : 140), () => {
        temporaries.forEach((sprite) => sprite.destroy());
        this.setGrid(next);
        gameBus.emit('tumble:done', {});
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Rune Orbs                                                          */
  /* ------------------------------------------------------------------ */

  private dropOrbs(orbs: OrbDrop[], turbo: boolean): void {
    const duration = turbo ? 240 : 520;

    orbs.forEach((orb, index) => {
      const tint = orbTint(orb.value);
      const x = cellX(orb.cell[0]);
      const y = cellY(orb.cell[1]);
      const delay = index * (turbo ? 60 : 150);

      const container = this.add.container(x, y - CELL_HEIGHT * 2.4).setScale(0.35);

      const aura = this.add
        .image(0, 0, 'fx-dot')
        .setTint(tint)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(3.2)
        .setAlpha(0.85);
      const body = this.add.image(0, 0, 'fx-orb').setTint(tint).setScale(1.12);
      const label = this.add
        .text(0, 2, `×${orb.value}`, {
          fontFamily: '"Chakra Petch", Sora, ui-monospace, monospace',
          fontSize: orb.value >= 100 ? '42px' : '50px',
          color: '#FFFFFF',
          stroke: '#0A0F1E',
          strokeThickness: 6,
        })
        .setOrigin(0.5);

      container.add([aura, body, label]);
      this.orbLayer.add(container);
      this.orbs.push({ id: orb.id, value: orb.value, container });

      this.tweens.add({
        targets: container,
        y,
        scale: 1,
        duration,
        delay,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.emitters.cyan?.setParticleTint(tint);
          this.emitters.cyan?.explode(10, x, y);
          this.cameras.main.shake(turbo ? 90 : 160, orb.value >= 50 ? 0.005 : 0.0022);
          // Idle shimmer so the orbs stay alive on the board.
          this.tweens.add({
            targets: aura,
            alpha: { from: 0.55, to: 1 },
            scale: { from: 3, to: 3.6 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          this.tweens.add({
            targets: container,
            y: y - 6,
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        },
      });
    });

    const total = orbs.length * (turbo ? 60 : 150) + duration + 160;
    this.time.delayedCall(total, () => gameBus.emit('orbs:done', {}));
  }

  private collectOrbs(total: number, turbo: boolean): void {
    if (this.orbs.length === 0) {
      gameBus.emit('orbs:collected', {});
      return;
    }

    const centreX = ORIGIN_X + GRID_WIDTH / 2;
    const centreY = ORIGIN_Y + GRID_HEIGHT / 2;
    const fly = turbo ? 220 : 420;
    const step = turbo ? 50 : 110;
    const collected = this.orbs.slice();
    this.orbs = [];

    collected.forEach((orb, index) => {
      this.tweens.killTweensOf(orb.container);
      this.tweens.add({
        targets: orb.container,
        scale: 1.35,
        duration: turbo ? 90 : 170,
        yoyo: true,
        delay: index * step * 0.4,
      });
      this.tweens.add({
        targets: orb.container,
        x: centreX,
        y: centreY,
        scale: 0.25,
        duration: fly,
        delay: (turbo ? 120 : 260) + index * step,
        ease: 'Back.easeIn',
        onComplete: () => {
          this.emitters.gold?.setParticleTint(0xffe9ae);
          this.emitters.gold?.explode(16, centreX, centreY);
          orb.container.destroy();
        },
      });
    });

    const revealAt = (turbo ? 120 : 260) + collected.length * step + fly;

    this.time.delayedCall(revealAt, () => {
      this.cameras.main.flash(turbo ? 140 : 260, 255, 233, 174);
      this.cameras.main.shake(turbo ? 160 : 340, 0.008);

      const label = this.add
        .text(centreX, centreY, `×${total}`, {
          fontFamily: '"Chakra Petch", Sora, ui-monospace, monospace',
          fontSize: '190px',
          color: '#FFE9AE',
          stroke: '#2A1806',
          strokeThickness: 14,
        })
        .setOrigin(0.5)
        .setDepth(22)
        .setScale(0.2)
        .setAlpha(0);

      this.tweens.add({
        targets: label,
        scale: 1,
        alpha: 1,
        duration: turbo ? 200 : 420,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: label,
            scale: 1.35,
            alpha: 0,
            delay: turbo ? 240 : 620,
            duration: turbo ? 200 : 420,
            ease: 'Quad.easeIn',
            onComplete: () => {
              label.destroy();
              gameBus.emit('orbs:collected', {});
            },
          });
        },
      });
    });
  }

  private clearOrbs(): void {
    this.orbs.forEach((orb) => {
      this.tweens.killTweensOf(orb.container);
      orb.container.destroy();
    });
    this.orbs = [];
    this.orbLayer.removeAll(true);
  }

  private applyTheme(guardian: GuardianId | null): void {
    const color = guardian ? GUARDIAN_MAP[guardian].colors.primary : '#25D9FF';
    this.themeColor = Phaser.Display.Color.HexStringToColor(color).color;
    this.dust?.setParticleTint(guardian ? this.themeColor : [0xf8c65b, 0x25d9ff, 0x8a4dff]);
  }
}

