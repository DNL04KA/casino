import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { TempleBackground } from '@/components/layout/TempleBackground';
import { GameStage } from '@/components/layout/GameStage';
import { TopBar } from '@/components/ui/TopBar';
import { BottomBar } from '@/components/ui/BottomBar';
import { Preloader } from '@/components/screens/Preloader';
import { IntroScreen } from '@/components/screens/IntroScreen';
import { BigWinOverlay } from '@/components/overlays/BigWinOverlay';
import { RoundBanner } from '@/components/overlays/RoundBanner';
import { BonusIntro } from '@/components/overlays/BonusIntro';
import { FreeSpinsHud } from '@/components/overlays/FreeSpinsHud';
import { PickRelic } from '@/components/overlays/PickRelic';
import { BonusSummary } from '@/components/overlays/BonusSummary';
import { InfoModal } from '@/components/modals/InfoModal';
import { PaytableModal } from '@/components/modals/PaytableModal';
import { HistoryModal } from '@/components/modals/HistoryModal';
import { useSlotMachine } from '@/hooks/useSlotMachine';
import { useSound } from '@/hooks/useSound';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useKeyboardShortcuts, type ShortcutMap } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/utils/cn';

export default function App(): JSX.Element {
  const { state, timings, actions } = useSlotMachine();
  const { enabled: soundOn, toggle: toggleSound } = useSound();
  const fullscreen = useFullscreen();
  const [rendererError, setRendererError] = useState<string | null>(null);

  const { phase, bonus, relic, modal } = state;
  const showIntro = phase === 'intro';
  const showPreloader = phase === 'preload';
  const inGame = !showPreloader && !showIntro;

  const handlePreloadDone = useCallback(() => actions.setPhase('intro'), [actions]);

  const handleSpin = useCallback(() => {
    if (state.auto.active) {
      actions.startAuto();
      return;
    }
    actions.spin();
  }, [actions, state.auto.active]);

  const shortcuts = useMemo<ShortcutMap>(
    () => ({
      ' ': () => handleSpin(),
      Enter: () => handleSpin(),
      t: () => actions.toggleTurbo(),
      a: () => actions.startAuto(),
      i: () => actions.openModal('info'),
      p: () => actions.openModal('paytable'),
      h: () => actions.openModal('history'),
      m: () => toggleSound(),
      f: () => void fullscreen.toggle(),
      '+': () => actions.changeBet(1),
      '=': () => actions.changeBet(1),
      '-': () => actions.changeBet(-1),
      _: () => actions.changeBet(-1),
      ArrowUp: () => actions.changeBet(1),
      ArrowDown: () => actions.changeBet(-1),
    }),
    [actions, fullscreen, handleSpin, toggleSound],
  );

  // Feature rounds own the screen, so the global shortcut layer stands down.
  const featurePhase = phase === 'pickRelic' || phase === 'bonusIntro' || phase === 'summary';
  useKeyboardShortcuts(shortcuts, inGame && modal === null && !featurePhase);

  const chromeClass = cn(
    'transition-opacity duration-500',
    showIntro && 'pointer-events-none select-none opacity-25',
  );

  const celebrating = phase === 'bigWin';
  const roundLive =
    state.progress.active &&
    (state.progress.running > 0 || state.progress.tumble > 0 || state.progress.collecting);
  const backgroundDimmed =
    celebrating || phase === 'bonusIntro' || phase === 'pickRelic' || phase === 'summary';

  return (
    // `data-phase` mirrors the demo state machine so the current state is
    // visible in devtools and easy to assert against in end-to-end checks.
    <div className="relative flex h-full w-full flex-col overflow-hidden" data-phase={phase}>
      <TempleBackground guardian={bonus.guardian} dimmed={backgroundDimmed} />

      <AnimatePresence>
        {showPreloader && <Preloader key="preloader" onComplete={handlePreloadDone} />}
      </AnimatePresence>

      <AnimatePresence>
        {showIntro && (
          <IntroScreen
            key="intro"
            onEnter={actions.enterGame}
            onOpenInfo={() => actions.openModal('info')}
          />
        )}
      </AnimatePresence>

      {!showPreloader && (
        <>
          <div className={chromeClass}>
            <TopBar
              soundOn={soundOn}
              onToggleSound={toggleSound}
              onOpenInfo={() => actions.openModal('info')}
              onOpenPaytable={() => actions.openModal('paytable')}
              onOpenHistory={() => actions.openModal('history')}
              onToggleFullscreen={() => void fullscreen.toggle()}
              isFullscreen={fullscreen.isFullscreen}
              fullscreenSupported={fullscreen.supported}
            />
          </div>

          <GameStage
            guardian={bonus.guardian}
            mounted={inGame || showIntro}
            excited={celebrating || state.progress.collecting || state.progress.tumble > 1}
            hideTitle={roundLive}
            onRendererError={setRendererError}
          >
            <RoundBanner progress={state.progress} />
          </GameStage>

          <div className={chromeClass}>
            <BottomBar
              credits={state.credits}
              bet={state.bet}
              betIndex={state.betIndex}
              lastWin={state.lastWin}
              tier={state.tier}
                phase={phase}
                turbo={state.turbo}
                auto={state.auto}
                countUpDuration={timings.countUpPerTier[state.tier]}
                onSpin={actions.spin}
              onAuto={actions.startAuto}
              onTurbo={actions.toggleTurbo}
              onBetChange={actions.changeBet}
              onTopUp={actions.topUp}
            />
          </div>
        </>
      )}

      {/* Feature layers */}
      <AnimatePresence>
        {bonus.active && !bonus.choosing && <FreeSpinsHud key="fs-hud" bonus={bonus} />}
      </AnimatePresence>

      <BigWinOverlay
        visible={celebrating}
        tier={state.tier}
        amount={state.lastWin}
        bet={state.bet}
        duration={timings.countUpPerTier[state.tier]}
        orbMultiplier={state.progress.orbMultiplier}
        tumbles={state.progress.tumbleTotal}
      />

      <BonusIntro
        visible={phase === 'bonusIntro'}
        turbo={state.turbo}
        onChoose={(guardian) => void actions.chooseGuardian(guardian)}
      />

      <PickRelic
        visible={phase === 'pickRelic'}
        relic={relic}
        onPick={actions.pickRelic}
        onContinue={actions.closeRelicHunt}
      />

      <BonusSummary
        visible={phase === 'summary' && state.summary !== null}
        title={state.summary?.title ?? ''}
        subtitle={state.summary?.subtitle ?? ''}
        total={state.summary?.total ?? 0}
        spins={bonus.spinsTotal}
        guardian={bonus.guardian}
        onContinue={actions.closeBonus}
      />

      {/* Modals */}
      <InfoModal open={modal === 'info'} onClose={() => actions.openModal(null)} />
      <PaytableModal open={modal === 'paytable'} onClose={() => actions.openModal(null)} bet={state.bet} />
      <HistoryModal open={modal === 'history'} onClose={() => actions.openModal(null)} history={state.history} />

      {/* Toasts */}
      <AnimatePresence>
        {(state.notice || rendererError) && (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            className="pointer-events-none fixed bottom-32 left-1/2 z-50 -translate-x-1/2 px-4"
            role="status"
            aria-live="polite"
          >
            <div className="glass-panel gold-hairline rounded-2xl border-crimson-neon/40 px-4 py-2.5 text-center text-xs text-slate-200">
              {rendererError ? `Renderer: ${rendererError}` : state.notice}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
