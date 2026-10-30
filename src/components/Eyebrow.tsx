/** Bracketed micro-label, e.g. ( WHAT WE OFFER ). */
export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`eyebrow ${className}`}>
      <span className="text-soft">(</span>&nbsp;{children}&nbsp;<span className="text-soft">)</span>
    </p>
  );
}
