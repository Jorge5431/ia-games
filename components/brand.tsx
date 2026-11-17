import Link from 'next/link';

export function Brand() {
  return <Link href="/" className="brand brand-lockup" aria-label="Vornelix — início">
    <svg className="brand-symbol" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#801C32"/>
      <path d="M9 9.5h7l4 8 4-8h7L20 32Z" fill="#F2E5D2" stroke="#100C0D" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="m14 12 6 13 6-13" fill="none" stroke="#100C0D" strokeWidth="1.15" strokeLinejoin="round"/>
    </svg>
    <span className="brand-wordmark"><span className="brand-name">VORNELIX</span><span className="brand-tagline">GAMING REIMAGINED</span></span>
  </Link>;
}
