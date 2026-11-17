import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { session } from '@/lib/supabase';
import { siteUrl } from '@/lib/config';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow-condensed/latin-900.css';
import '@fontsource-variable/instrument-sans';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title:{default:'VORNELIX | Gaming Reimagined',template:'%s | Vornelix'},
  description:'Descubra jogos criados com inteligência artificial na Vornelix.',
  openGraph:{type:'website',locale:'pt_BR',siteName:'Vornelix',images:[{url:'/marca-vornelix.webp'}]},
};

export default async function RootLayout({children}:Readonly<{children:React.ReactNode}>) {
  const current=await session();
  return <html lang="pt-BR"><body>
    <a className="skip" href="#main">Pular para o conteúdo</a>
    <Navigation signedIn={Boolean(current)}/>
    <main id="main">{children}</main>
    <footer className="footer"><div className="container footer-inner">
      <div><Link className="brand" href="/">VORNELIX</Link><p className="muted">Gaming Reimagined</p></div>
      <nav aria-label="Institucional"><Link href="/about">Sobre</Link><Link href="/support">Suporte</Link><Link href="/terms">Termos</Link><Link href="/privacy">Privacidade</Link></nav>
    </div></footer>
  </body></html>;
}
