import type { Cell, Grid, GuardianId, LineWin, OrbDrop, SymbolId } from '@/types';

type Empty = Record<string, never>;

/** Every message that crosses the React ⇄ Phaser boundary. */
export interface GameEvents {
  'scene:ready': Empty;
  'reels:set': { grid: Grid };
  'reels:spin': { grid: Grid; turbo: boolean; anticipationReels: number[] };
  'reels:stopped': { reel: number };
  'reels:complete': Empty;
  'mystery:reveal': { cells: Cell[]; symbol: SymbolId; turbo: boolean };
  'mystery:done': Empty;
  'wild:expand': { reels: number[]; turbo: boolean };
  'wild:done': Empty;
  'wins:show': { wins: LineWin[]; turbo: boolean };
  'wins:clear': Empty;
  /** Winning symbols shatter, survivors drop, gaps refill. */
  'tumble:clear': { cleared: Cell[]; next: Grid; turbo: boolean };
  'tumble:done': Empty;
  /** Rune Orbs land on the board and stay until the round resolves. */
  'orbs:drop': { orbs: OrbDrop[]; turbo: boolean };
  'orbs:done': Empty;
  /** Every orb flies to the centre and the values fuse into one multiplier. */
  'orbs:collect': { total: number; turbo: boolean };
  'orbs:collected': Empty;
  'orbs:clear': Empty;
  'scatter:hit': { index: number };
  'fx:burst': { kind: 'gold' | 'violet' | 'cyan' | 'crimson'; strength?: number };
  'fx:shake': { intensity: number; duration: number };
  'theme:set': { guardian: GuardianId | null };
}

type Handler<K extends keyof GameEvents> = (payload: GameEvents[K]) => void;

class TypedEmitter {
  private handlers = new Map<keyof GameEvents, Set<(payload: never) => void>>();

  on<K extends keyof GameEvents>(event: K, handler: Handler<K>): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as (payload: never) => void);
    this.handlers.set(event, set);
    return () => this.off(event, handler);
  }

  once<K extends keyof GameEvents>(event: K, handler: Handler<K>): () => void {
    const off = this.on(event, ((payload: GameEvents[K]) => {
      off();
      handler(payload);
    }) as Handler<K>);
    return off;
  }

  off<K extends keyof GameEvents>(event: K, handler: Handler<K>): void {
    this.handlers.get(event)?.delete(handler as (payload: never) => void);
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of Array.from(set)) {
      (handler as Handler<K>)(payload);
    }
  }

  /** Promise helper with a safety timeout so the UI can never dead-lock. */
  wait<K extends keyof GameEvents>(event: K, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        off();
        window.clearTimeout(timer);
        resolve();
      };
      const off = this.once(event, (() => finish()) as Handler<K>);
      const timer = window.setTimeout(finish, timeoutMs);
    });
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const gameBus = new TypedEmitter();
