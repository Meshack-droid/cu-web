export function CommunityArt(props: { className?: string }) {
  return (
    <svg viewBox="0 0 600 440" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
      <circle cx="300" cy="230" r="200" fill="var(--color-gold-100)" opacity="0.5" />

      {/* ground */}
      <rect x="60" y="360" width="480" height="10" rx="5" fill="var(--color-primary-200, var(--color-primary-100))" />

      {/* chapel / campus building with bell tower */}
      <g>
        <rect x="230" y="220" width="140" height="140" fill="var(--color-primary-500)" />
        <path d="M220 220 L300 160 L380 220 Z" fill="var(--color-primary-600)" />
        <rect x="285" y="120" width="30" height="50" fill="var(--color-primary-600)" />
        <path d="M280 120 L300 95 L320 120 Z" fill="var(--color-primary-700)" />
        <rect x="296" y="80" width="8" height="24" fill="var(--color-gold-500)" />
        <rect x="288" y="88" width="24" height="8" fill="var(--color-gold-500)" />

        {/* door */}
        <path d="M280 360 L280 300 C280 288 320 288 320 300 L320 360 Z" fill="var(--color-primary-900)" />
        {/* windows */}
        <circle cx="255" cy="255" r="10" fill="var(--color-gold-400)" opacity="0.85" />
        <circle cx="345" cy="255" r="10" fill="var(--color-gold-400)" opacity="0.85" />
      </g>

      {/* small figures walking toward the building */}
      <g fill="var(--color-primary-700)">
        <g transform="translate(140 330)">
          <circle cx="0" cy="-22" r="12" />
          <path d="M-14 30 C-14 8 -8 -2 0 -2 C8 -2 14 8 14 30 Z" />
        </g>
        <g transform="translate(180 340)">
          <circle cx="0" cy="-18" r="10" fill="var(--color-gold-500)" />
          <path d="M-11 26 C-11 6 -6 -2 0 -2 C6 -2 11 6 11 26 Z" fill="var(--color-gold-500)" />
        </g>
        <g transform="translate(450 335)">
          <circle cx="0" cy="-20" r="11" fill="var(--color-primary-500)" />
          <path d="M-13 28 C-13 7 -7 -2 0 -2 C7 -2 13 7 13 28 Z" fill="var(--color-primary-500)" />
        </g>
      </g>

      <g fill="var(--color-primary-300)" opacity="0.5">
        <circle cx="500" cy="150" r="5" />
        <circle cx="90" cy="150" r="4" />
        <circle cx="530" cy="260" r="4" />
      </g>
    </svg>
  );
}
