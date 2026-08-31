import Phaser from 'phaser';
import { useEffect, useRef, useState } from 'react';
import { VIEW_HEIGHT, VIEW_WIDTH } from '@/game/constants';
import { TempleScene } from '@/game/scenes/TempleScene';

interface PhaserGameProps {
  /** Raised once the WebGL/Canvas stage failed to boot, so the shell can warn. */
  onError?: (message: string) => void;
}

/**
 * Mounts the Phaser reel stage. The canvas is transparent and floats above the
 * DOM/SVG temple background, which keeps the parallax layers cheap and lets the
 * UI stay fully accessible HTML.
 */
export function PhaserGame({ onError }: PhaserGameProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return undefined;

    try {
      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: VIEW_WIDTH,
        height: VIEW_HEIGHT,
        transparent: true,
        banner: false,
        antialias: true,
        roundPixels: false,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        fps: { target: 60, min: 30 },
        scene: [TempleScene],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown renderer error';
      setFailed(true);
      onError?.(message);
    }

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
    // The stage is created once for the lifetime of the demo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div ref={containerRef} className="h-full w-full [&>canvas]:!h-full [&>canvas]:!w-full" />
      {failed && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-crimson-neon">
          The reel renderer could not start in this browser. Try enabling hardware acceleration.
        </div>
      )}
    </div>
  );
}
