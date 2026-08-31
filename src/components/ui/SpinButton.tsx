import { motion } from 'framer-motion';
import { soundEngine } from '@/audio/SoundEngine';
import { cn } from '@/utils/cn';

interface SpinButtonProps {
  onClick: () => void;
  disabled?: boolean;
  spinning?: boolean;
  autoActive?: boolean;
  label?: string;
}

const OCTAGON = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';

/**
 * The hero control: an octagonal gold plate with a cyan halo. Fully keyboard
 * operable and never silently ignores a press — it reports why it is locked.
 */
export function SpinButton({
  onClick,
  disabled = false,
  spinning = false,
  autoActive = false,
  label,
}: SpinButtonProps): JSX.Element {
  const caption = label ?? (spinning ? 'Spinning' : autoActive ? 'Stop' : 'Spin');

  return (
    <div className="relative grid place-items-center">
      {/* Outer halo */}
      <div
        className="pointer-events-none absolute h-[124%] w-[124%] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(37,217,255,0.35) 0%, rgba(37,217,255,0) 68%)',
          filter: 'blur(6px)',
        }}
      />
      {spinning && (
        <span
          className="pointer-events-none absolute h-[112%] w-[112%] rounded-full border-2 border-cyan-neon/50 border-t-transparent"
          style={{ animation: 'portalSpin 1.1s linear infinite' }}
        />
      )}

      <motion.button
        type="button"
        onClick={() => {
          soundEngine.click();
          onClick();
        }}
        onMouseEnter={() => !disabled && soundEngine.hover()}
        aria-label={
          spinning
            ? 'Spin in progress'
            : autoActive
              ? 'Stop auto spin'
              : 'Spin the reels — demo round'
        }
        aria-disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.94 }}
        whileHover={disabled ? undefined : { scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        className={cn(
          'relative grid h-[86px] w-[86px] place-items-center text-night-900 transition-all sm:h-[104px] sm:w-[104px]',
          'focus-visible:outline-none',
          disabled && 'cursor-not-allowed',
        )}
        style={{ clipPath: OCTAGON }}
      >
        <span
          className="absolute inset-0"
          style={{
            clipPath: OCTAGON,
            background: disabled
              ? 'linear-gradient(150deg,#5b5f6b,#2c3038)'
              : 'linear-gradient(150deg,#FFE9AE 0%,#F8C65B 42%,#C8912B 74%,#FFE9AE 100%)',
            boxShadow: disabled ? 'none' : '0 0 26px rgba(37,217,255,0.55), 0 0 60px rgba(248,198,91,0.35)',
          }}
        />
        <span
          className="absolute inset-[5px]"
          style={{
            clipPath: OCTAGON,
            background: disabled
              ? 'linear-gradient(160deg,#3c414c,#22262e)'
              : 'linear-gradient(160deg,#FFF4D6 0%,#F8C65B 46%,#D79E30 100%)',
            boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.55), inset 0 -6px 14px rgba(140,92,10,0.45)',
          }}
        />
        {!disabled && (
          <span
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ clipPath: OCTAGON }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-y-0 w-1/3 bg-white/25"
              style={{ animation: 'shimmerSweep 3.4s ease-in-out infinite' }}
            />
          </span>
        )}

        <span className="relative flex flex-col items-center gap-0.5">
          <span
            className={cn(
              'font-display text-[15px] uppercase tracking-[0.16em] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] sm:text-[17px]',
              disabled ? 'text-slate-300' : 'text-[#3B2606]',
            )}
          >
            {caption}
          </span>
          <span
            className={cn(
              'text-[8px] uppercase tracking-[0.22em]',
              disabled ? 'text-slate-400' : 'text-[#7A5308]',
            )}
          >
            Demo
          </span>
        </span>
      </motion.button>
    </div>
  );
}
