import { useEffect } from 'react';

export type ShortcutMap = Record<string, (event: KeyboardEvent) => void>;

const INTERACTIVE = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Global keyboard layer. Buttons keep their native Enter/Space activation — the
 * map here only fires when focus is not already on a control, so nothing is
 * ever triggered twice.
 */
export function useKeyboardShortcuts(map: ShortcutMap, active = true): void {
  useEffect(() => {
    if (!active) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (INTERACTIVE.has(target.tagName) || target.isContentEditable)) return;

      const isActivationKey = event.key === ' ' || event.key === 'Enter';
      const focusIsButton = target?.tagName === 'BUTTON' || target?.getAttribute('role') === 'button';
      if (isActivationKey && focusIsButton) return;

      const handler = map[event.key] ?? map[event.key.toLowerCase()];
      if (!handler) return;
      event.preventDefault();
      handler(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [map, active]);
}
