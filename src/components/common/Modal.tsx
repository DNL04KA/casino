import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { soundEngine } from '@/audio/SoundEngine';
import { cn } from '@/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/** Accessible dialog: Escape to close, focus moved in and trapped while open. */
export function Modal({ open, onClose, title, eyebrow, children, className }: ModalProps): JSX.Element {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    window.setTimeout(() => {
      const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel)?.focus();
    }, 30);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0] as HTMLElement;
      const last = items[items.length - 1] as HTMLElement;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div
            className="absolute inset-0 bg-night-900/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className={cn(
              'glass-panel gold-hairline relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl',
              className,
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5">
              <div>
                {eyebrow && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-neon/80">
                    {eyebrow}
                  </p>
                )}
                <h2 className="font-display text-xl text-gold-light sm:text-2xl">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                onMouseEnter={() => soundEngine.hover()}
                className="btn-ghost !px-3 !py-1.5"
                aria-label="Close dialog"
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  ×
                </span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </header>
            <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
