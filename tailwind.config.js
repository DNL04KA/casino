/** @type {import('tailwindcss').Config} */
/** Full 0–100 opacity scale so every `/NN` colour modifier resolves. */
const opacity = Object.fromEntries(
  Array.from({ length: 101 }, (_, i) => [String(i), String(i / 100)]),
);

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      opacity,
      colors: {
        night: {
          900: '#050B15',
          800: '#08111F',
          700: '#0C1830',
          600: '#130B2C',
          500: '#1B1140',
        },
        cyan: {
          neon: '#25D9FF',
        },
        violet: {
          neon: '#8A4DFF',
        },
        gold: {
          DEFAULT: '#F8C65B',
          deep: '#C8912B',
          light: '#FFE9AE',
        },
        emerald: {
          neon: '#28D6A0',
        },
        crimson: {
          neon: '#FF4D6D',
        },
      },
      fontFamily: {
        sans: ['Sora', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Cinzel Decorative"', 'Cinzel', 'Georgia', 'serif'],
        numeric: ['"Chakra Petch"', 'Sora', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 12px rgba(37,217,255,0.45), 0 0 42px rgba(37,217,255,0.22)',
        'neon-gold': '0 0 14px rgba(248,198,91,0.5), 0 0 48px rgba(248,198,91,0.25)',
        'neon-violet': '0 0 12px rgba(138,77,255,0.45), 0 0 40px rgba(138,77,255,0.25)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 18px 44px rgba(0,0,0,0.55)',
      },
      backgroundImage: {
        'gold-sheen': 'linear-gradient(135deg,#FFE9AE 0%,#F8C65B 38%,#C8912B 62%,#FFE9AE 100%)',
        'panel-glass': 'linear-gradient(160deg, rgba(28,40,70,0.72) 0%, rgba(14,18,40,0.82) 100%)',
      },
      keyframes: {
        'float-slow': {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-14px,0)' },
        },
        'drift-clouds': {
          '0%': { transform: 'translate3d(-12%,0,0)' },
          '100%': { transform: 'translate3d(12%,0,0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.86)', opacity: '0.75' },
          '70%': { transform: 'scale(1.35)', opacity: '0' },
          '100%': { transform: 'scale(1.35)', opacity: '0' },
        },
        'rune-flicker': {
          '0%,100%': { opacity: '0.35' },
          '45%': { opacity: '1' },
          '55%': { opacity: '0.6' },
        },
        'sweep': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'rise': {
          '0%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0' },
          '12%': { opacity: '0.9' },
          '100%': { transform: 'translate3d(var(--drift,10px),-120px,0) scale(0.2)', opacity: '0' },
        },
      },
      animation: {
        'float-slow': 'float-slow 9s ease-in-out infinite',
        'drift-clouds': 'drift-clouds 48s ease-in-out infinite alternate',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.22,1,0.36,1) infinite',
        'rune-flicker': 'rune-flicker 3.6s ease-in-out infinite',
        sweep: 'sweep 2.8s ease-in-out infinite',
        'spin-slow': 'spin-slow 26s linear infinite',
      },
    },
  },
  plugins: [],
};
