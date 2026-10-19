export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex font-display font-black uppercase tracking-[0.2em] ${className}`}>
      <span className="sr-only">Lucía Perfumería</span>
      {['L', 'U', 'C', 'Í', 'A'].map((letter, index) => (
        <span aria-hidden="true" className="lt" key={index}>
          {letter}
        </span>
      ))}
    </span>
  );
}
