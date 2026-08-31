import { useCallback, useEffect, useState } from 'react';

/**
 * Rendering tiers.
 *
 * `high` is the full showcase. `balanced` keeps the game feel but drops the
 * ambient extras that cost fill rate. `saver` strips every effect that is not
 * the game itself — it exists so the demo stays smooth on a phone or an old
 * laptop, which is exactly where a portfolio piece gets opened.
 */
export type QualityTier = 'high' | 'balanced' | 'saver';

const STORAGE_KEY = 'ntgof:quality';
export const QUALITY_ORDER: QualityTier[] = ['high', 'balanced', 'saver'];

export const QUALITY_LABEL: Record<QualityTier, string> = {
  high: 'High detail',
  balanced: 'Balanced',
  saver: 'Performance',
};

/**
 * Picks a starting tier from what the device is willing to tell us. Deliberately
 * conservative: a touch device or a low core count starts at `balanced`, because
 * a demo that stutters on first contact never gets a second look.
 */
function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 'balanced';

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;

  if (cores <= 4 || memory <= 4) return coarse || small ? 'saver' : 'balanced';
  if (coarse || small) return 'balanced';
  return 'high';
}

function readStored(): QualityTier {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && QUALITY_ORDER.includes(stored as QualityTier)) return stored as QualityTier;
  } catch {
    /* private mode — fall through to detection */
  }
  return detectTier();
}

/**
 * Current tier plus a cycle action. The tier is mirrored onto
 * `document.documentElement` as `data-quality` so plain CSS can respond
 * without threading props through every component.
 */
export function useQuality() {
  const [tier, setTier] = useState<QualityTier>(readStored);

  useEffect(() => {
    document.documentElement.dataset.quality = tier;
    try {
      window.localStorage.setItem(STORAGE_KEY, tier);
    } catch {
      /* storage can be unavailable; the tier still applies for this session */
    }
  }, [tier]);

  const cycle = useCallback(() => {
    setTier((current) => {
      const next = QUALITY_ORDER[(QUALITY_ORDER.indexOf(current) + 1) % QUALITY_ORDER.length];
      return next as QualityTier;
    });
  }, []);

  return { tier, setTier, cycle };
}
