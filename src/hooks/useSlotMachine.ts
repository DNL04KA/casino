import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { soundEngine } from '@/audio/SoundEngine';
import {
  AUTO_SPIN_MAX,
  BET_STEPS,
  DEFAULT_BET_INDEX,
  FREE_SPINS_AWARD,
  RELIC_CARD_COUNT,
  RELIC_PICKS,
  STARTING_CREDITS,
  PURSE_MULTIPLIER_CAP,
  TIMING,
} from '@/data/config';
import { RELIC_NAMES, RELIC_REWARDS } from '@/data/relics';
import { EMPTY_TABLE, GUEST_ORDER } from '@/data/guests';
import { GUARDIAN_MAP } from '@/data/guardians';
import { gameBus } from '@/game/bus';
import type {
  AutoSpinState,
  GamePhase,
  GameState,
  Grid,
  GuardianId,
  GuestId,
  HistoryEntry,
  LineWin,
  ModalId,
  RelicCard,
  RelicReward,
  RoundProgress,
  SpinOutcome,
  WinTier,
} from '@/types';
import { createIdleGrid, generateSpin, tierFor } from '@/utils/spinEngine';
import { shuffle, uid } from '@/utils/rng';

/* -------------------------------------------------------------------------- */
/*  Reducer                                                                   */
/* -------------------------------------------------------------------------- */

type Action =
  | { type: 'phase'; phase: GamePhase }
  | { type: 'bet'; index: number }
  | { type: 'turbo'; value?: boolean }
  | { type: 'modal'; modal: ModalId }
  | { type: 'notice'; notice: string | null }
  | { type: 'beginSpin'; cost: number }
  | { type: 'landGrid'; grid: Grid }
  | { type: 'settle'; win: number; credit: number; wins: LineWin[]; tier: WinTier; entry: HistoryEntry }
  | { type: 'running'; win: number; tier: WinTier; wins: LineWin[] }
  | { type: 'progress'; value: Partial<RoundProgress> }
  | { type: 'serve'; ids: GuestId[] }
  | { type: 'clearTable' }
  | { type: 'auto'; value: Partial<AutoSpinState> }
  | { type: 'bonusStart' }
  | { type: 'bonusGuardian'; guardian: GuardianId; spins: number }
  | { type: 'bonusSpinConsumed' }
  | { type: 'bonusAward'; amount: number; multiplier: number }
  | { type: 'bonusEnd' }
  | { type: 'bonusClose' }
  | { type: 'relicStart'; cards: RelicCard[] }
  | { type: 'relicReveal'; index: number; reward: RelicReward }
  | { type: 'relicFinish' }
  | { type: 'relicClose' }
  | { type: 'topUp' };

function createInitialState(): GameState {
  return {
    phase: 'preload',
    credits: STARTING_CREDITS,
    betIndex: DEFAULT_BET_INDEX,
    bet: BET_STEPS[DEFAULT_BET_INDEX],
    lastWin: 0,
    sessionWin: 0,
    grid: createIdleGrid(),
    wins: [],
    tier: 'none',
    history: [],
    spinCount: 0,
    auto: { active: false, remaining: 0 },
    turbo: false,
    bonus: { active: false, guardian: null, choosing: false, spinsTotal: 0, spinsLeft: 0, multiplier: 1, total: 0 },
    relic: { active: false, cards: [], picksLeft: RELIC_PICKS, total: 0, finished: false },
    modal: null,
    guests: { ...EMPTY_TABLE },
    progress: { active: false, tumble: 0, tumbleTotal: 0, running: 0, orbMultiplier: 0, collecting: false },
    notice: null,
    summary: null,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'phase':
      return { ...state, phase: action.phase };
    case 'bet': {
      const index = Math.max(0, Math.min(BET_STEPS.length - 1, action.index));
      return { ...state, betIndex: index, bet: BET_STEPS[index] };
    }
    case 'turbo':
      return { ...state, turbo: action.value ?? !state.turbo };
    case 'modal':
      return { ...state, modal: action.modal };
    case 'notice':
      return { ...state, notice: action.notice };
    case 'beginSpin':
      return {
        ...state,
        phase: 'spinning',
        progress: { active: false, tumble: 0, tumbleTotal: 0, running: 0, orbMultiplier: 0, collecting: false },
        credits: state.credits - action.cost,
        lastWin: 0,
        wins: [],
        tier: 'none',
        notice: null,
        spinCount: state.spinCount + 1,
      };
    case 'landGrid':
      return { ...state, grid: action.grid };
    case 'settle':
      return {
        ...state,
        phase: 'result',
        credits: state.credits + action.credit,
        lastWin: action.win,
        sessionWin: state.sessionWin + action.credit,
        wins: action.wins,
        tier: action.tier,
        history: [action.entry, ...state.history].slice(0, 10),
      };
    case 'running':
      return { ...state, lastWin: action.win, tier: action.tier, wins: action.wins };
    case 'progress':
      return { ...state, progress: { ...state.progress, ...action.value } };
    case 'serve': {
      if (action.ids.every((id) => state.guests[id])) return state;
      const guests = { ...state.guests };
      action.ids.forEach((id) => {
        guests[id] = true;
      });
      return { ...state, guests };
    }
    case 'clearTable':
      return { ...state, guests: { ...EMPTY_TABLE } };
    case 'auto':
      return { ...state, auto: { ...state.auto, ...action.value } };
    case 'bonusStart':
      return {
        ...state,
        phase: 'bonusIntro',
        bonus: { active: true, guardian: null, choosing: true, spinsTotal: 0, spinsLeft: 0, multiplier: 1, total: 0 },
      };
    case 'bonusGuardian':
      return {
        ...state,
        phase: 'freeSpins',
        bonus: {
          ...state.bonus,
          guardian: action.guardian,
          choosing: false,
          spinsTotal: action.spins,
          spinsLeft: action.spins,
          multiplier: 1,
        },
      };
    case 'bonusSpinConsumed':
      return { ...state, bonus: { ...state.bonus, spinsLeft: Math.max(0, state.bonus.spinsLeft - 1) } };
    case 'bonusAward':
      return {
        ...state,
        bonus: { ...state.bonus, total: state.bonus.total + action.amount, multiplier: action.multiplier },
      };
    case 'bonusEnd':
      return {
        ...state,
        phase: 'summary',
        summary: {
          title: 'The Service Is Over',
          subtitle: state.bonus.guardian
            ? `${GUARDIAN_MAP[state.bonus.guardian].title} · ${GUARDIAN_MAP[state.bonus.guardian].feature}`
            : 'Demo bonus round',
          total: state.bonus.total,
        },
      };
    case 'bonusClose':
      return {
        ...state,
        phase: 'idle',
        credits: state.credits + state.bonus.total,
        sessionWin: state.sessionWin + state.bonus.total,
        summary: null,
        bonus: { active: false, guardian: null, choosing: false, spinsTotal: 0, spinsLeft: 0, multiplier: 1, total: 0 },
      };
    case 'relicStart':
      return {
        ...state,
        phase: 'pickRelic',
        relic: { active: true, cards: action.cards, picksLeft: RELIC_PICKS, total: 0, finished: false },
      };
    case 'relicReveal': {
      const cards = state.relic.cards.map((card) =>
        card.index === action.index ? { ...card, revealed: true, reward: action.reward } : card,
      );
      return {
        ...state,
        relic: {
          ...state.relic,
          cards,
          picksLeft: Math.max(0, state.relic.picksLeft - 1),
          total: state.relic.total + action.reward.points * state.bet,
        },
      };
    }
    case 'relicFinish':
      return { ...state, relic: { ...state.relic, finished: true } };
    case 'relicClose':
      return {
        ...state,
        phase: 'idle',
        credits: state.credits + state.relic.total,
        sessionWin: state.sessionWin + state.relic.total,
        relic: { active: false, cards: [], picksLeft: RELIC_PICKS, total: 0, finished: false },
      };
    case 'topUp':
      return { ...state, credits: STARTING_CREDITS, notice: 'Demo credits reloaded — still worth nothing.' };
    default:
      return state;
  }
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function buildRelicCards(): RelicCard[] {
  const names = shuffle(RELIC_NAMES).slice(0, RELIC_CARD_COUNT);
  return names.map((name, index) => ({ index, name, revealed: false, reward: null }));
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

export function useSlotMachine() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  const stateRef = useRef(state);
  stateRef.current = state;

  const busyRef = useRef(false);
  const stopAutoRef = useRef(false);
  const spinsSinceBonusRef = useRef(0);
  const pendingRef = useRef({ wildExpansion: false, mysteryCluster: false, bonusSpins: 0 });
  const rewardPoolRef = useRef<RelicReward[]>([]);

  const timing = state.turbo ? TIMING.turbo : TIMING.normal;

  /* Reel-stop audio lives here so the Phaser scene stays presentation-only. */
  useEffect(() => {
    const off = gameBus.on('reels:stopped', ({ reel }) => soundEngine.reelStop(reel));
    return off;
  }, []);

  /* Push the resting board into the scene as soon as it is alive. */
  useEffect(() => {
    const off = gameBus.on('scene:ready', () => {
      gameBus.emit('reels:set', { grid: stateRef.current.grid });
    });
    return off;
  }, []);

  const notify = useCallback((message: string | null) => {
    dispatch({ type: 'notice', notice: message });
    if (message) window.setTimeout(() => dispatch({ type: 'notice', notice: null }), 2600);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Single demo round                                                */
  /* ---------------------------------------------------------------- */

  const playRound = useCallback(
    async (mode: 'base' | 'free'): Promise<'normal' | 'feature'> => {
      const current = stateRef.current;
      const t = current.turbo ? TIMING.turbo : TIMING.normal;
      const bet = current.bet;
      const guardian = current.bonus.guardian;

      // Seated guests shape the board before a single reel turns. Their payout
      // favours are applied to the result rather than to the spin mode: free
      // mode also suppresses scatters, so borrowing it would quietly stop the
      // base game from ever opening the service.
      const seated = current.guests;
      const houseFavour = (seated.okami ? 1.1 : 1) * (seated.tanuki ? 1.5 : 1);

      const outcome: SpinOutcome = generateSpin({
        bet,
        mode:
          mode === 'free' && guardian
            ? { kind: 'free', guardian, multiplier: current.bonus.multiplier }
            : { kind: 'base' },
        spinIndex: current.spinCount,
        spinsSinceBonus: spinsSinceBonusRef.current,
        forceWildExpansion: pendingRef.current.wildExpansion || seated.kasa,
        forceMysteryCluster: pendingRef.current.mysteryCluster || seated.kitsune,
      });
      pendingRef.current.wildExpansion = false;
      pendingRef.current.mysteryCluster = false;

      if (mode === 'base') {
        dispatch({ type: 'beginSpin', cost: bet });
        spinsSinceBonusRef.current += 1;
      } else {
        dispatch({ type: 'beginSpin', cost: 0 });
        dispatch({ type: 'bonusSpinConsumed' });
      }
      dispatch({ type: 'phase', phase: 'spinning' });

      soundEngine.spinStart();
      gameBus.emit('wins:clear', {});
      gameBus.emit('reels:spin', {
        grid: outcome.landedGrid,
        turbo: current.turbo,
        anticipationReels: outcome.anticipationReels,
      });

      if (outcome.anticipationReels.length > 0) {
        window.setTimeout(() => soundEngine.anticipation(), t.firstReelStop);
      }

      // Safety timeout: the UI must never lock up if the renderer stalls.
      await gameBus.wait('reels:complete', 14_000);

      if (outcome.mysteryCells.length > 0 && outcome.mysteryReveal) {
        gameBus.emit('mystery:reveal', {
          cells: outcome.mysteryCells,
          symbol: outcome.mysteryReveal,
          turbo: current.turbo,
        });
        soundEngine.relicReveal();
        await gameBus.wait('mystery:done', 6000);
      }

      if (outcome.expandedReels.length > 0) {
        gameBus.emit('wild:expand', { reels: outcome.expandedReels, turbo: current.turbo });
        soundEngine.guardianChosen();
        await gameBus.wait('wild:done', 6000);
      }

      dispatch({ type: 'landGrid', grid: outcome.finalGrid });

      if (outcome.scatterCount >= 3) {
        outcome.scatterCells.forEach((cell, i) => {
          window.setTimeout(() => {
            soundEngine.scatterHit(i);
            gameBus.emit('scatter:hit', { index: cell[0] });
          }, i * 260);
        });
        await delay(outcome.scatterCells.length * (current.turbo ? 90 : 260));
      }

      /* ---- tumble chain ---------------------------------------------- */
      let multiplier = current.bonus.multiplier;
      if (mode === 'free' && guardian === 'tanuki' && outcome.totalWin > 0) {
        multiplier = Math.min(PURSE_MULTIPLIER_CAP, multiplier + 1);
      }

      const orbsByStep = new Map<number, typeof outcome.orbs>();
      for (const orb of outcome.orbs) {
        const bucket = orbsByStep.get(orb.step) ?? [];
        bucket.push(orb);
        orbsByStep.set(orb.step, bucket);
      }

      const tumbleTotal = outcome.steps.filter((step) => step.cleared.length > 0).length;
      dispatch({
        type: 'progress',
        value: { active: true, tumble: 0, tumbleTotal, running: 0, orbMultiplier: 0, collecting: false },
      });

      let running = 0;
      let tumbleIndex = 0;

      for (const step of outcome.steps) {
        const stepOrbs = orbsByStep.get(step.index) ?? [];
        if (stepOrbs.length > 0) {
          soundEngine.orbDrop(stepOrbs.length);
          gameBus.emit('orbs:drop', { orbs: stepOrbs, turbo: current.turbo });
          await gameBus.wait('orbs:done', 8000);
        }

        if (step.wins.length > 0) {
          running += step.stepWin;
          const stepTier = tierFor(running, bet);
          dispatch({ type: 'running', win: running, tier: stepTier, wins: step.wins });
          dispatch({ type: 'progress', value: { tumble: tumbleIndex, running } });
          gameBus.emit('wins:show', { wins: step.wins, turbo: current.turbo });

          if (step.index === 0) {
            if (stepTier === 'small') soundEngine.smallWin();
            else soundEngine.niceWin();
          } else {
            soundEngine.tumbleHit(tumbleIndex);
          }

          await delay(step.cleared.length > 0 ? t.winCycle * 0.7 : t.winCycle * 0.4);
        }

        if (step.cleared.length > 0 && step.next) {
          tumbleIndex += 1;
          dispatch({ type: 'progress', value: { tumble: tumbleIndex } });
          soundEngine.tumble();
          gameBus.emit('tumble:clear', { cleared: step.cleared, next: step.next, turbo: current.turbo });
          await gameBus.wait('tumble:done', 8000);
        }
      }

      /* ---- rune orbs --------------------------------------------------- */
      if (outcome.orbMultiplier > 0) {
        dispatch({ type: 'progress', value: { collecting: true, orbMultiplier: outcome.orbMultiplier } });
        soundEngine.orbCollect(outcome.orbMultiplier);
        gameBus.emit('orbs:collect', { total: outcome.orbMultiplier, turbo: current.turbo });
        await gameBus.wait('orbs:collected', 12_000);
      } else if (outcome.orbs.length > 0) {
        gameBus.emit('orbs:clear', {});
      }

      /* ---- the room remembers ------------------------------------------ */
      const served = GUEST_ORDER.filter(
        (id) => !seated[id] && outcome.wins.some((win) => win.symbol === id),
      );
      if (served.length > 0) {
        soundEngine.guardianChosen();
        dispatch({ type: 'serve', ids: served });
      }
      const tableAfter = { ...seated };
      served.forEach((id) => {
        tableAfter[id] = true;
      });
      const houseFull = GUEST_ORDER.every((id) => tableAfter[id]);

      /* ---- settle ------------------------------------------------------ */
      const awarded = Math.round(outcome.totalWin * houseFavour);
      const entry: HistoryEntry = {
        id: uid('spin'),
        index: current.spinCount + 1,
        timestamp: Date.now(),
        bet: mode === 'base' ? bet : 0,
        win: awarded,
        tier: outcome.tier,
        mode: mode === 'free' ? 'free' : 'base',
        topSymbol: outcome.wins[0]?.symbol ?? null,
        lines: outcome.wins.filter((w) => w.lineId !== 0).length,
        scatters: outcome.scatterCount,
        tumbles: tumbleTotal,
        orbMultiplier: outcome.orbMultiplier,
      };

      if (mode === 'free') {
        dispatch({ type: 'bonusAward', amount: outcome.totalWin, multiplier });
        dispatch({
          type: 'settle',
          win: outcome.totalWin,
          credit: 0,
          wins: outcome.wins,
          tier: outcome.tier,
          entry,
        });
      } else {
        dispatch({
          type: 'settle',
          win: awarded,
          credit: awarded,
          wins: outcome.wins,
          tier: outcome.tier,
          entry,
        });
      }

      if (outcome.tier === 'big') soundEngine.bigWin(1);
      else if (outcome.tier === 'mega') soundEngine.bigWin(2);
      else if (outcome.tier === 'epic') soundEngine.bigWin(3);

      const isCelebration = outcome.tier === 'big' || outcome.tier === 'mega' || outcome.tier === 'epic';
      if (isCelebration) {
        dispatch({ type: 'phase', phase: 'bigWin' });
        gameBus.emit('fx:burst', { kind: 'gold', strength: outcome.tier === 'epic' ? 2 : 1.3 });
        gameBus.emit('fx:shake', { intensity: outcome.tier === 'epic' ? 0.012 : 0.006, duration: 600 });
        await delay(t.countUpPerTier[outcome.tier] + t.bigWinHold);
      } else if (outcome.totalWin > 0) {
        await delay(t.countUpPerTier[outcome.tier] + (current.turbo ? 120 : 500));
      } else {
        await delay(current.turbo ? 120 : 380);
      }

      /* ---- features -------------------------------------------------- */
      if (houseFull && mode === 'base') {
        spinsSinceBonusRef.current = 0;
        dispatch({ type: 'clearTable' });
        notify('Every seat is taken — the road comes in.');
        await startBonus();
        return 'feature';
      }

      if (outcome.triggersFreeSpins) {
        spinsSinceBonusRef.current = 0;
        await startBonus();
        return 'feature';
      }

      if (outcome.triggersRelicHunt && mode === 'base') {
        await startRelicHunt();
        return 'feature';
      }

      gameBus.emit('wins:clear', {});
      gameBus.emit('orbs:clear', {});
      dispatch({ type: 'progress', value: { active: false, collecting: false } });
      dispatch({ type: 'phase', phase: mode === 'free' ? 'freeSpins' : 'idle' });
      return 'normal';
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /*  Bonus round                                                      */
  /* ---------------------------------------------------------------- */

  const startBonus = useCallback(async () => {
    gameBus.emit('wins:clear', {});
    soundEngine.bonusIntro();
    dispatch({ type: 'bonusStart' });
    // The cinematic gate transition owns the screen while it plays.
    await delay(stateRef.current.turbo ? 1400 : 3200);
    soundEngine.gateOpen();
  }, []);

  const chooseGuardian = useCallback(async (guardian: GuardianId) => {
    if (busyRef.current && stateRef.current.phase !== 'bonusIntro') return;
    soundEngine.guardianChosen();
    gameBus.emit('theme:set', { guardian });
    const spins = FREE_SPINS_AWARD + pendingRef.current.bonusSpins;
    pendingRef.current.bonusSpins = 0;
    dispatch({ type: 'bonusGuardian', guardian, spins });

    await delay(900);

    for (let i = 0; i < spins; i += 1) {
      if (!stateRef.current.bonus.active) break;
      await playRound('free');
      await delay(stateRef.current.turbo ? 220 : 620);
    }

    gameBus.emit('wins:clear', {});
    gameBus.emit('fx:burst', { kind: 'gold', strength: 1.6 });
    soundEngine.bigWin(2);
    dispatch({ type: 'bonusEnd' });
  }, [playRound]);

  const closeBonus = useCallback(() => {
    soundEngine.click();
    gameBus.emit('theme:set', { guardian: null });
    dispatch({ type: 'bonusClose' });
    busyRef.current = false;
    void resumeAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Relic hunt                                                       */
  /* ---------------------------------------------------------------- */

  const startRelicHunt = useCallback(async () => {
    gameBus.emit('wins:clear', {});
    rewardPoolRef.current = shuffle(RELIC_REWARDS);
    dispatch({ type: 'relicStart', cards: buildRelicCards() });
    soundEngine.heartbeat();
    await delay(600);
  }, []);

  const pickRelic = useCallback((index: number) => {
    const current = stateRef.current;
    if (!current.relic.active || current.relic.picksLeft <= 0) return;
    const card = current.relic.cards.find((c) => c.index === index);
    if (!card || card.revealed) return;

    const reward = rewardPoolRef.current.pop() ?? RELIC_REWARDS[0];
    soundEngine.relicReveal();
    dispatch({ type: 'relicReveal', index, reward });

    if (reward.type === 'wildExpansion') pendingRef.current.wildExpansion = true;
    if (reward.type === 'mysteryReveal') pendingRef.current.mysteryCluster = true;
    if (reward.type === 'extraSpins') pendingRef.current.bonusSpins += 2;

    if (current.relic.picksLeft <= 1) {
      window.setTimeout(() => {
        soundEngine.bigWin(1);
        gameBus.emit('fx:burst', { kind: 'violet', strength: 1.4 });
        dispatch({ type: 'relicFinish' });
      }, 900);
    } else {
      window.setTimeout(() => soundEngine.heartbeat(), 500);
    }
  }, []);

  const closeRelicHunt = useCallback(() => {
    soundEngine.click();
    dispatch({ type: 'relicClose' });
    busyRef.current = false;
    void resumeAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Auto spin driver                                                 */
  /* ---------------------------------------------------------------- */

  const runLoop = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    stopAutoRef.current = false;

    try {
      let result = await playRound('base');
      while (
        result === 'normal' &&
        stateRef.current.auto.active &&
        stateRef.current.auto.remaining > 0 &&
        !stopAutoRef.current
      ) {
        dispatch({ type: 'auto', value: { remaining: stateRef.current.auto.remaining - 1 } });
        await delay(stateRef.current.turbo ? TIMING.turbo.betweenAutoSpins : TIMING.normal.betweenAutoSpins);
        if (stopAutoRef.current || !stateRef.current.auto.active) break;
        if (stateRef.current.credits < stateRef.current.bet) {
          notify('Demo credits exhausted — reload them from the balance panel.');
          break;
        }
        result = await playRound('base');
      }

      if (stateRef.current.auto.remaining <= 0 || stopAutoRef.current) {
        dispatch({ type: 'auto', value: { active: false, remaining: 0 } });
      }
      if (result === 'feature') {
        // The loop pauses here; closeBonus/closeRelicHunt resume it.
        return;
      }
    } catch (error) {
      console.error('[Neon Temple] demo round failed', error);
      notify('The demo round could not finish. Reels have been reset.');
      gameBus.emit('reels:set', { grid: stateRef.current.grid });
      dispatch({ type: 'phase', phase: 'idle' });
      dispatch({ type: 'auto', value: { active: false, remaining: 0 } });
    } finally {
      if (
        stateRef.current.phase !== 'pickRelic' &&
        stateRef.current.phase !== 'summary' &&
        stateRef.current.phase !== 'freeSpins' &&
        stateRef.current.phase !== 'bonusIntro'
      ) {
        busyRef.current = false;
      }
    }
  }, [notify, playRound]);

  const resumeAuto = useCallback(async () => {
    if (!stateRef.current.auto.active || stateRef.current.auto.remaining <= 0) {
      dispatch({ type: 'auto', value: { active: false, remaining: 0 } });
      return;
    }
    dispatch({ type: 'auto', value: { remaining: stateRef.current.auto.remaining - 1 } });
    await delay(400);
    void runLoop();
  }, [runLoop]);

  /* ---------------------------------------------------------------- */
  /*  Public actions                                                   */
  /* ---------------------------------------------------------------- */

  const spin = useCallback(() => {
    const current = stateRef.current;
    soundEngine.unlock();

    if (current.phase === 'bonusIntro' || current.phase === 'pickRelic' || current.phase === 'summary') {
      soundEngine.error();
      notify('Finish the feature round first.');
      return;
    }
    if (busyRef.current || (current.phase !== 'idle' && current.phase !== 'result')) {
      soundEngine.error();
      notify('Hold on — the reels are still spinning.');
      return;
    }
    if (current.credits < current.bet) {
      soundEngine.error();
      notify('Not enough demo credits. Reload them from the balance panel.');
      return;
    }
    void runLoop();
  }, [notify, runLoop]);

  const startAuto = useCallback(() => {
    const current = stateRef.current;
    soundEngine.click();
    if (current.auto.active) {
      stopAutoRef.current = true;
      dispatch({ type: 'auto', value: { active: false, remaining: 0 } });
      notify('Auto Spin stopped.');
      return;
    }
    dispatch({ type: 'auto', value: { active: true, remaining: AUTO_SPIN_MAX } });
    if (!busyRef.current) {
      window.setTimeout(() => void runLoop(), 40);
    }
  }, [notify, runLoop]);

  const changeBet = useCallback((direction: 1 | -1) => {
    const current = stateRef.current;
    if (current.phase === 'spinning' || current.phase === 'freeSpins') {
      soundEngine.error();
      notify('Demo stake is locked while the reels move.');
      return;
    }
    soundEngine.click();
    dispatch({ type: 'bet', index: current.betIndex + direction });
  }, [notify]);

  const setBetIndex = useCallback((index: number) => {
    soundEngine.click();
    dispatch({ type: 'bet', index });
  }, []);

  const toggleTurbo = useCallback(() => {
    soundEngine.click();
    dispatch({ type: 'turbo' });
  }, []);

  const openModal = useCallback((modal: ModalId) => {
    soundEngine.click();
    dispatch({ type: 'modal', modal });
  }, []);

  const enterGame = useCallback(() => {
    soundEngine.unlock();
    soundEngine.click();
    soundEngine.startAmbient();
    dispatch({ type: 'phase', phase: 'idle' });
  }, []);

  const setPhase = useCallback((phase: GamePhase) => dispatch({ type: 'phase', phase }), []);

  const topUp = useCallback(() => {
    soundEngine.click();
    dispatch({ type: 'topUp' });
  }, []);

  const timings = useMemo(() => timing, [timing]);

  return {
    state,
    timings,
    actions: {
      spin,
      startAuto,
      changeBet,
      setBetIndex,
      toggleTurbo,
      openModal,
      enterGame,
      setPhase,
      chooseGuardian,
      closeBonus,
      pickRelic,
      closeRelicHunt,
      topUp,
      notify,
    },
  };
}

export type SlotMachine = ReturnType<typeof useSlotMachine>;
