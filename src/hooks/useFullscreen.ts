import { useCallback, useEffect, useState } from 'react';

/** Fullscreen toggle with graceful degradation on browsers that refuse it. */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    setSupported(typeof document.documentElement.requestFullscreen === 'function');
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setSupported(false);
    }
  }, []);

  return { isFullscreen, supported, toggle };
}
