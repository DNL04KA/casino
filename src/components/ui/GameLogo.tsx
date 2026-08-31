import { cn } from '@/utils/cn';

interface GameLogoProps {
  size?: 'sm' | 'lg';
  className?: string;
}

/** Wordmark + gate sigil. Original lettering, no third-party branding. */
export function GameLogo({ size = 'sm', className }: GameLogoProps): JSX.Element {
  const large = size === 'lg';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        width={large ? 64 : 38}
        height={large ? 64 : 38}
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="logo-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFE9AE" />
            <stop offset="52%" stopColor="#F8C65B" />
            <stop offset="100%" stopColor="#8A4DFF" />
          </linearGradient>
        </defs>
        <path d="M32 4 56 18v28L32 60 8 46V18z" fill="none" stroke="url(#logo-gold)" strokeWidth="2.4" />
        <path d="M32 14v36M18 24h28" stroke="#25D9FF" strokeWidth="2.6" strokeLinecap="round" opacity="0.9" />
        <circle cx="32" cy="32" r="6.5" fill="none" stroke="#FFE9AE" strokeWidth="1.6" />
      </svg>

      <div className={cn('leading-none', !large && 'hidden sm:block')}>
        <h1
          className={cn(
            'neon-title whitespace-nowrap font-display tracking-wide',
            large ? 'text-4xl sm:text-6xl' : 'text-base sm:text-lg',
          )}
        >
          Neon Temple
        </h1>
        <p
          className={cn(
            'neon-sub whitespace-nowrap font-semibold uppercase',
            large ? 'mt-2 text-sm tracking-[0.42em] sm:text-base' : 'mt-1 text-[9px] tracking-[0.3em] sm:text-[10px]',
          )}
        >
          Guardians of Fortune
        </p>
      </div>
    </div>
  );
}
