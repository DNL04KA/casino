/** Small inline icon set — stroke-based so it inherits colour and glow. */
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const SoundOnIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16.5 8.5a5 5 0 010 7M19 6a9 9 0 010 12" />
  </svg>
);

export const SoundOffIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M17 9l4 6M21 9l-4 6" />
  </svg>
);

export const InfoIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.6v.5" />
  </svg>
);

export const TableIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M9.5 10v9.5M15 10v9.5" />
  </svg>
);

export const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <path d="M3.5 12a8.5 8.5 0 108.5-8.5A8.4 8.4 0 006 6.5" />
    <path d="M3.5 3.5v3.6h3.6M12 7.5V12l3 2" />
  </svg>
);

export const FullscreenIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

export const ExitFullscreenIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
  </svg>
);

export const BoltIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <path d="M13 2.5L5 13.5h5.5L10 21.5l8.5-11.5H13z" />
  </svg>
);

export const AutoIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <path d="M20.5 12a8.5 8.5 0 11-2.6-6.1" />
    <path d="M20.5 3.5V9H15" />
    <path d="M10 9.5l5 2.5-5 2.5z" />
  </svg>
);

export const StopIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
  </svg>
);

export const MinusIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <path d="M6 12h12" />
  </svg>
);

export const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <path d="M12 6v12M6 12h12" />
  </svg>
);

export const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base}>
    <path d="M20 11a8 8 0 10-1.2 5.4" />
    <path d="M20 4.5V11h-6.5" />
  </svg>
);
