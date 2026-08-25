export function BibleStudyArt(props: { className?: string }) {
  return (
    <svg viewBox="0 0 600 440" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
      <circle cx="300" cy="220" r="200" fill="var(--color-primary-50)" />
      <circle cx="460" cy="90" r="46" fill="var(--color-gold-100)" />

      {/* radiating light behind the book */}
      <g stroke="var(--color-gold-400)" strokeWidth="3" strokeLinecap="round" opacity="0.6">
        <line x1="300" y1="150" x2="300" y2="100" />
        <line x1="230" y1="170" x2="190" y2="130" />
        <line x1="370" y1="170" x2="410" y2="130" />
      </g>

      {/* open book */}
      <g>
        <path d="M300 210 L150 240 L150 340 L300 312 Z" fill="var(--color-primary-600)" />
        <path d="M300 210 L450 240 L450 340 L300 312 Z" fill="var(--color-primary-500)" />
        <path d="M300 210 L150 240 L150 250 L300 220 Z" fill="var(--color-primary-700)" />
        <path d="M300 210 L450 240 L450 250 L300 220 Z" fill="var(--color-primary-600)" />

        {/* page lines */}
        <g stroke="var(--color-primary-100)" strokeWidth="3" strokeLinecap="round">
          <line x1="175" y1="260" x2="270" y2="248" />
          <line x1="175" y1="278" x2="270" y2="266" />
          <line x1="175" y1="296" x2="270" y2="284" />
          <line x1="330" y1="248" x2="425" y2="260" />
          <line x1="330" y1="266" x2="425" y2="278" />
          <line x1="330" y1="284" x2="425" y2="296" />
        </g>
      </g>

      {/* cross bookmark */}
      <g transform="translate(285 150)">
        <rect x="10" y="0" width="10" height="70" rx="3" fill="var(--color-gold-500)" />
        <rect x="-8" y="18" width="46" height="10" rx="3" fill="var(--color-gold-500)" />
      </g>

      {/* small dots for texture */}
      <g fill="var(--color-primary-300)" opacity="0.5">
        <circle cx="110" cy="120" r="5" />
        <circle cx="90" cy="320" r="4" />
        <circle cx="500" cy="300" r="5" />
        <circle cx="520" cy="180" r="4" />
      </g>
    </svg>
  );
}
