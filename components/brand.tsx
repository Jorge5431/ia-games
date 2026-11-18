import Link from 'next/link';

export function Brand() {
  return <Link href="/" className="brand brand-lockup" aria-label="Vornelix — início">
    <svg className="brand-symbol brand-portal" viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
      <path d="M24 2 44 13.5V34.5L24 46 4 34.5V13.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".32"/>
      <path d="M24 2 44 13.5V24M24 46 4 34.5V24" fill="none" stroke="#ff6500" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M11 12H19L27 30 23 39Z" fill="currentColor"/>
      <path d="M29 12H38L25 37 21 28Z" fill="#ff6500"/>
      <path d="M33 7 40 11M8 37 15 41" stroke="#ff6500" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    <span className="brand-wordmark"><span className="brand-name brand-shimmer">VORNELIX</span><span className="brand-tagline">GAMING REIMAGINED</span></span>
  </Link>;
}
