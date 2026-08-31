import { motion } from 'framer-motion';
import { GUARDIAN_MAP } from '@/data/guardians';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { GuardianId } from '@/types';

interface GuardianColossusProps {
  side: 'left' | 'right';
  guardian: GuardianId | null;
  /** Raised during celebrations — the colossus channels energy at the reels. */
  excited?: boolean;
}

/**
 * A temple colossus standing in front of each pillar: original armoured deity
 * art, drawn entirely in SVG so it stays crisp and re-tints with the active
 * Guardian.
 */
export function GuardianColossus({ side, guardian, excited = false }: GuardianColossusProps): JSX.Element {
  const reduceMotion = useReducedMotion();
  const theme = guardian ? GUARDIAN_MAP[guardian].colors : { primary: '#25D9FF', secondary: '#F8C65B' };
  const uid = `colossus-${side}`;

  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex items-end justify-center"
      animate={reduceMotion ? undefined : { y: [0, -9, 0] }}
      transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 640" className="h-[94%] w-full" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id={`${uid}-armour`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#4B5D86" />
            <stop offset="38%" stopColor="#26324F" />
            <stop offset="72%" stopColor="#141B2E" />
            <stop offset="100%" stopColor="#0A0E1A" />
          </linearGradient>
          <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFE9AE" />
            <stop offset="45%" stopColor="#F8C65B" />
            <stop offset="100%" stopColor="#8A6416" />
          </linearGradient>
          <linearGradient id={`${uid}-robe`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.55" />
            <stop offset="55%" stopColor="#161F38" />
            <stop offset="100%" stopColor="#080C16" />
          </linearGradient>
          <radialGradient id={`${uid}-aura`}>
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.55" />
            <stop offset="55%" stopColor={theme.primary} stopOpacity="0.14" />
            <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uid}-soft`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>

        {/* Aura */}
        <motion.ellipse
          cx="100"
          cy="330"
          rx="98"
          ry="250"
          fill={`url(#${uid}-aura)`}
          animate={reduceMotion ? undefined : { opacity: excited ? [0.75, 1, 0.75] : [0.35, 0.6, 0.35] }}
          transition={{ duration: excited ? 1.1 : 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Cape */}
        <path
          d="M56 250 C28 320 22 440 30 588 L64 588 C58 460 62 340 78 288 Z"
          fill={`url(#${uid}-robe)`}
          opacity="0.9"
        />
        <path
          d="M144 250 C172 320 178 440 170 588 L136 588 C142 460 138 340 122 288 Z"
          fill={`url(#${uid}-robe)`}
          opacity="0.9"
        />

        {/* Plinth */}
        <path d="M26 592 L174 592 L182 616 L18 616 Z" fill="#131C33" stroke={theme.primary} strokeOpacity="0.3" />
        <path d="M12 616 L188 616 L196 640 L4 640 Z" fill="#0C1424" stroke="#F8C65B" strokeOpacity="0.25" />

        {/* Robe / lower body */}
        <path
          d="M62 330 C56 420 48 510 44 592 L156 592 C152 510 144 420 138 330 Z"
          fill={`url(#${uid}-armour)`}
        />
        {[78, 100, 122].map((x) => (
          <path key={x} d={`M${x} 340 L${x + (x - 100) * 0.12} 588`} stroke="#000" strokeOpacity="0.35" strokeWidth="2" />
        ))}

        {/* Belt */}
        <rect x="58" y="322" width="84" height="18" rx="4" fill={`url(#${uid}-gold)`} />
        <circle cx="100" cy="331" r="8" fill={theme.primary} opacity="0.9" />

        {/* Torso */}
        <path
          d="M66 214 C70 190 84 176 100 176 C116 176 130 190 134 214 L142 322 L58 322 Z"
          fill={`url(#${uid}-armour)`}
          stroke="#05080F"
          strokeWidth="2"
        />
        <path d="M100 200 L100 318" stroke={theme.primary} strokeOpacity="0.5" strokeWidth="2.5" />
        <path d="M74 240 L126 240 M72 268 L128 268" stroke="#F8C65B" strokeOpacity="0.45" strokeWidth="2.5" />

        {/* Chest sigil */}
        <g filter={`url(#${uid}-glow)`}>
          <polygon
            points="100,222 118,248 100,274 82,248"
            fill="none"
            stroke={`url(#${uid}-gold)`}
            strokeWidth="3"
          />
          <motion.circle
            cx="100"
            cy="248"
            r="7"
            fill={theme.primary}
            animate={reduceMotion ? undefined : { opacity: [0.5, 1, 0.5] }}
            transition={{ duration: excited ? 0.7 : 3.2, repeat: Infinity }}
          />
        </g>

        {/* Pauldrons */}
        {[
          { x: 56, flip: -1 },
          { x: 144, flip: 1 },
        ].map(({ x, flip }) => (
          <g key={x}>
            <path
              d={`M${x} 186 C${x + flip * 26} 188 ${x + flip * 30} 214 ${x + flip * 22} 232 L${x - flip * 6} 224 Z`}
              fill={`url(#${uid}-gold)`}
              stroke="#7A5308"
              strokeWidth="1.5"
            />
            <path
              d={`M${x + flip * 4} 200 C${x + flip * 18} 202 ${x + flip * 22} 214 ${x + flip * 18} 224`}
              stroke="#FFF6DA"
              strokeOpacity="0.55"
              strokeWidth="2"
              fill="none"
            />
          </g>
        ))}

        {/* Arms */}
        <path
          d="M62 206 C44 224 38 268 42 316 L60 318 C58 274 62 240 74 222 Z"
          fill={`url(#${uid}-armour)`}
          stroke="#05080F"
          strokeWidth="1.5"
        />
        <path
          d="M138 204 C160 196 178 168 184 132 L166 124 C160 156 148 178 130 190 Z"
          fill={`url(#${uid}-armour)`}
          stroke="#05080F"
          strokeWidth="1.5"
        />

        {/* Channelled orb in the raised hand */}
        <motion.g
          filter={`url(#${uid}-glow)`}
          animate={reduceMotion ? undefined : { scale: excited ? [1, 1.22, 1] : [1, 1.07, 1] }}
          transition={{ duration: excited ? 0.8 : 3.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '176px 116px' }}
        >
          <circle cx="176" cy="116" r="22" fill={theme.primary} opacity="0.28" />
          <circle cx="176" cy="116" r="13" fill={theme.primary} />
          <circle cx="172" cy="111" r="4.5" fill="#FFFFFF" opacity="0.9" />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={176 + Math.cos(a) * 20}
                y1={116 + Math.sin(a) * 20}
                x2={176 + Math.cos(a) * 30}
                y2={116 + Math.sin(a) * 30}
                stroke={theme.secondary}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.8"
              />
            );
          })}
        </motion.g>

        {/* Head */}
        <motion.circle
          cx="100"
          cy="146"
          r="52"
          fill="none"
          stroke={theme.secondary}
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeDasharray="10 14"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 46, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '100px 146px' }}
        />
        <path
          d="M76 158 C76 128 86 112 100 112 C114 112 124 128 124 158 C124 176 114 186 100 186 C86 186 76 176 76 158 Z"
          fill={`url(#${uid}-armour)`}
          stroke="#05080F"
          strokeWidth="2"
        />
        {/* Visor */}
        <g filter={`url(#${uid}-glow)`}>
          <motion.path
            d="M80 150 L120 150 L116 162 L84 162 Z"
            fill={theme.primary}
            animate={reduceMotion ? undefined : { opacity: excited ? [0.8, 1, 0.8] : [0.55, 0.95, 0.55] }}
            transition={{ duration: excited ? 0.6 : 4, repeat: Infinity }}
          />
        </g>
        {/* Crown */}
        <path
          d="M72 128 L82 96 L92 122 L100 84 L108 122 L118 96 L128 128 Z"
          fill={`url(#${uid}-gold)`}
          stroke="#7A5308"
          strokeWidth="1.5"
        />
        {/* Horns */}
        <path d="M74 132 C52 120 42 96 46 72" stroke={`url(#${uid}-gold)`} strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M126 132 C148 120 158 96 154 72" stroke={`url(#${uid}-gold)`} strokeWidth="7" fill="none" strokeLinecap="round" />

        {/* Ground light */}
        <ellipse cx="100" cy="618" rx="90" ry="16" fill={theme.primary} opacity="0.18" filter={`url(#${uid}-soft)`} />

        {/* Channelled energy during celebrations */}
        {excited && (
          <g>
            {[0, 1, 2].map((i) => (
              <motion.path
                key={i}
                d={`M176 128 L${150 - i * 8} ${190 + i * 40} L${168 - i * 6} ${232 + i * 44} L${120 - i * 10} ${300 + i * 46}`}
                stroke={theme.secondary}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                filter={`url(#${uid}-glow)`}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.2, 0.9, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
              />
            ))}
          </g>
        )}
      </svg>
    </motion.div>
  );
}
