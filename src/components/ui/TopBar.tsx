import { IconButton } from '@/components/ui/IconButton';
import { GameLogo } from '@/components/ui/GameLogo';
import {
  ExitFullscreenIcon,
  FullscreenIcon,
  GaugeIcon,
  HistoryIcon,
  InfoIcon,
  SoundOffIcon,
  SoundOnIcon,
  TableIcon,
} from '@/components/ui/icons';

interface TopBarProps {
  soundOn: boolean;
  onToggleSound: () => void;
  onOpenInfo: () => void;
  onOpenPaytable: () => void;
  onOpenHistory: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  fullscreenSupported: boolean;
  qualityLabel: string;
  onCycleQuality: () => void;
}

export function TopBar({
  soundOn,
  onToggleSound,
  onOpenInfo,
  onOpenPaytable,
  onOpenHistory,
  onToggleFullscreen,
  isFullscreen,
  fullscreenSupported,
  qualityLabel,
  onCycleQuality,
}: TopBarProps): JSX.Element {
  // Icon rail has to survive a 375 px viewport alongside the wordmark.
  const compact = '!h-9 !px-2 sm:!h-10 sm:!px-3';

  return (
    <header className="relative z-30 flex items-center justify-between gap-3 px-3 py-2 sm:px-5 sm:py-3">
      <GameLogo />

      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="demo-chip hidden rounded-full px-3 py-1.5 text-[10px] font-bold sm:inline-block">
          For Demo Purposes
        </span>

        <IconButton
          icon={soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
          label={soundOn ? 'Mute sound' : 'Unmute sound'}
          active={soundOn}
          onClick={onToggleSound}
          className={compact}
        />
        <IconButton
          icon={<TableIcon />}
          label="Paytable"
          tone="gold"
          onClick={onOpenPaytable}
          className={compact}
        />
        <IconButton
          icon={<HistoryIcon />}
          label="Demo history"
          tone="violet"
          onClick={onOpenHistory}
          className={compact}
        />
        <IconButton
          icon={<GaugeIcon />}
          label={`Graphics: ${qualityLabel} — tap to change`}
          onClick={onCycleQuality}
          className={compact}
        />
        <IconButton icon={<InfoIcon />} label="Game info" onClick={onOpenInfo} className={compact} />
        <IconButton
          icon={isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          onClick={onToggleFullscreen}
          disabled={!fullscreenSupported}
          className={compact}
        />
      </div>
    </header>
  );
}
