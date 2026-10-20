export function HeroSeal({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`spin pointer-events-none ${className}`}>
      <svg className="h-full w-full" viewBox="0 0 120 120">
        <defs>
          <path d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" id="lucia-seal-circle" />
        </defs>
        <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
        <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />
        <text className="fill-current text-[10px] font-semibold uppercase" style={{ letterSpacing: '0.26em' }}>
          <textPath href="#lucia-seal-circle">Lucía Perfumería · Fragancias originales ·</textPath>
        </text>
      </svg>
    </div>
  );
}
