// Generic four-point spark mark, not a brand-specific letter — this repo
// is a starter cloned into differently-named projects (see nav.brand in
// lib/dictionaries), so the mark can't assume a first letter to monogram.
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="15" fill="#7c3aed" />
      <path
        d="M16 7c.6 3.4 2.4 5.6 6 6.5-3.6.9-5.4 3.1-6 6.5-.6-3.4-2.4-5.6-6-6.5 3.6-.9 5.4-3.1 6-6.5Z"
        fill="#f1f5f9"
      />
    </svg>
  );
}
