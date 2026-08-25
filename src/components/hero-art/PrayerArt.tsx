export function PrayerArt(props: { className?: string }) {
  return (
    <svg viewBox="0 0 600 440" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
      <circle cx="300" cy="220" r="200" fill="var(--color-gold-100)" opacity="0.6" />
      <circle cx="150" cy="330" r="50" fill="var(--color-primary-50)" />

      {/* sunburst */}
      <g stroke="var(--color-gold-500)" strokeWidth="4" strokeLinecap="round" opacity="0.7">
        <line x1="300" y1="90" x2="300" y2="50" />
        <line x1="230" y1="115" x2="195" y2="80" />
        <line x1="370" y1="115" x2="405" y2="80" />
        <line x1="180" y1="165" x2="140" y2="150" />
        <line x1="420" y1="165" x2="460" y2="150" />
      </g>
      <circle cx="300" cy="165" r="38" fill="var(--color-gold-400)" opacity="0.85" />

      {/* dove */}
      <g transform="translate(300 165)">
        <path
          d="M-22 4 C-10 -14 10 -14 22 4 C14 -2 6 -2 0 6 C-6 -2 -14 -2 -22 4 Z"
          fill="white"
        />
        <circle cx="10" cy="-6" r="2.2" fill="var(--color-primary-700)" />
      </g>

      {/* raised hands / figure, simplified */}
      <g fill="var(--color-primary-600)">
        <path d="M300 230 C280 230 268 248 268 268 L268 360 C268 372 278 382 290 382 L310 382 C322 382 332 372 332 360 L332 268 C332 248 320 230 300 230 Z" />
        <circle cx="300" cy="208" r="24" />
        {/* arms raised */}
        <path
          d="M272 250 C250 230 235 195 232 165"
          stroke="var(--color-primary-600)"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M328 250 C350 230 365 195 368 165"
          stroke="var(--color-primary-600)"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      <g fill="var(--color-primary-300)" opacity="0.5">
        <circle cx="480" cy="120" r="5" />
        <circle cx="500" cy="340" r="4" />
        <circle cx="110" cy="200" r="4" />
      </g>
    </svg>
  );
}
