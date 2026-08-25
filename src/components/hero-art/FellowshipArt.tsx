const FIGURE_POSITIONS = [
  { x: 300, y: 110, color: 'var(--color-primary-600)' },
  { x: 420, y: 160, color: 'var(--color-gold-500)' },
  { x: 460, y: 280, color: 'var(--color-primary-500)' },
  { x: 380, y: 370, color: 'var(--color-primary-700)' },
  { x: 220, y: 370, color: 'var(--color-gold-600)' },
  { x: 140, y: 280, color: 'var(--color-primary-500)' },
  { x: 180, y: 160, color: 'var(--color-primary-600)' },
];

function Figure({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="-26" r="16" fill={color} />
      <path d="M-20 40 C-20 10 -12 -4 0 -4 C12 -4 20 10 20 40 Z" fill={color} />
    </g>
  );
}

export function FellowshipArt(props: { className?: string }) {
  return (
    <svg viewBox="0 0 600 440" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
      <circle cx="300" cy="240" r="200" fill="var(--color-primary-50)" />

      {/* connecting circle */}
      <circle
        cx="300"
        cy="240"
        r="150"
        stroke="var(--color-gold-400)"
        strokeWidth="3"
        strokeDasharray="2 14"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* center emblem: simple cross */}
      <g transform="translate(300 240)">
        <rect x="-6" y="-30" width="12" height="60" rx="4" fill="var(--color-gold-500)" opacity="0.9" />
        <rect x="-22" y="-10" width="44" height="12" rx="4" fill="var(--color-gold-500)" opacity="0.9" />
      </g>

      {FIGURE_POSITIONS.map((f, i) => (
        <Figure key={i} {...f} />
      ))}

      <g fill="var(--color-primary-300)" opacity="0.5">
        <circle cx="90" cy="100" r="5" />
        <circle cx="520" cy="380" r="4" />
        <circle cx="80" cy="380" r="4" />
      </g>
    </svg>
  );
}
