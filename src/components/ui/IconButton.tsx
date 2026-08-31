import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { soundEngine } from '@/audio/SoundEngine';
import { cn } from '@/utils/cn';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  /** Shows the label next to the icon on wider screens. */
  showLabel?: boolean;
  active?: boolean;
  tone?: 'default' | 'gold' | 'violet' | 'danger';
}

const TONES: Record<NonNullable<IconButtonProps['tone']>, string> = {
  default: 'hover:border-cyan-neon/60 hover:text-white hover:shadow-neon-cyan',
  gold: 'hover:border-gold/70 hover:text-gold-light hover:shadow-neon-gold',
  violet: 'hover:border-violet-neon/70 hover:text-white hover:shadow-neon-violet',
  danger: 'hover:border-crimson-neon/70 hover:text-crimson-neon',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, showLabel = false, active = false, tone = 'default', className, onClick, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      onMouseEnter={() => soundEngine.hover()}
      onClick={(event) => {
        soundEngine.click();
        onClick?.(event);
      }}
      className={cn(
        'group inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-all duration-200',
        'border-white/12 bg-white/[0.07] text-slate-200',
        'active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40',
        TONES[tone],
        active && 'border-gold/70 bg-gold/15 text-gold-light shadow-neon-gold',
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true" className="grid h-5 w-5 place-items-center">
        {icon}
      </span>
      {showLabel && <span className="hidden text-xs uppercase tracking-widest sm:inline">{label}</span>}
    </button>
  );
});
