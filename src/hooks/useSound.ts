import { useCallback, useEffect, useState } from 'react';
import { soundEngine } from '@/audio/SoundEngine';

const STORAGE_KEY = 'ntgof:sound';

function readStored(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

/** Sound toggle + a stable handle on the synthesised audio engine. */
export function useSound() {
  const [enabled, setEnabled] = useState<boolean>(readStored);

  useEffect(() => {
    soundEngine.setMuted(!enabled);
    try {
      window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    } catch {
      /* storage can be unavailable in private mode — the demo still runs */
    }
  }, [enabled]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) {
        soundEngine.unlock();
        soundEngine.setMuted(false);
        soundEngine.click();
      }
      return next;
    });
  }, []);

  const unlock = useCallback(() => {
    soundEngine.unlock();
  }, []);

  return { enabled, setEnabled, toggle, unlock, sound: soundEngine };
}
