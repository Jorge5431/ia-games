import Link from 'next/link';

export function Brand() {
  return <Link href="/" className="brand brand-lockup" aria-label="Vornelix — início">
    <svg className="brand-symbol" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <rect className="brand-symbol-bg" width="40" height="40" rx="11"/>
      <path d="M9 9.5h7l4 8 4-8h7L20 32Z" fill="#F5F5F5" stroke="#080808" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="m14 12 6 13 6-13" fill="none" stroke="#080808" strokeWidth="1.15" strokeLinejoin="round"/>
      <path d="m25.2 9.5 5.8 0L18.3 31.2l-2.7-4.4Z" className="brand-symbol-cut"/>
    </svg>
    <span className="brand-wordmark"><span className="brand-name">VORNELIX</span><span className="brand-tagline">GAMING REIMAGINED</span></span>
  </Link>;
}
