const letters = ['p', 'e', 'r', 'f', 'u', 'm', 'e', 's'];

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span aria-label="Lucía Perfumería" className={`brand-logo ${className}`} role="img">
      <span aria-hidden="true" className="brand-logo-name">Lucía</span>
      <span aria-hidden="true" className="brand-logo-sub">
        {letters.map((letter, index) => (
          <span key={index}>{letter}</span>
        ))}
      </span>
    </span>
  );
}
