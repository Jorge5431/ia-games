import Image from 'next/image';
import Link from 'next/link';

export function Brand() {
  return <Link href="/" className="brand brand-lockup" aria-label="Vornelix — início">
    <Image className="brand-symbol" src="/vornelix-symbol.webp" width={40} height={40} alt="" style={{objectFit:"contain",borderRadius:6}}/>
    <span className="brand-wordmark"><span className="brand-name brand-shimmer">VORNELIX</span><span className="brand-tagline">GAMING REIMAGINED</span></span>
  </Link>;
}
