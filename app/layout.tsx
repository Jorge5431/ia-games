import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { parsePreferences, preferenceCookie } from '@/lib/preferences';
import { PreferencesProvider } from '@/components/preferences-provider';
import { Brand } from '@/components/brand';
import { Navigation } from '@/components/navigation';
import { session } from '@/lib/supabase';
import { publicImage } from '@/lib/catalog';
import { siteUrl } from '@/lib/config';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/orbitron';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title:{default:'VORNELIX | Gaming Reimagined',template:'%s | Vornelix'},
  description:'Descubra jogos criados com inteligência artificial na Vornelix.',
  openGraph:{type:'website',locale:'pt_BR',siteName:'Vornelix',images:[{url:'/marca-vornelix.webp'}]},
};

export default async function RootLayout({children}:Readonly<{children:React.ReactNode}>) {
  const current=await session();
  const {data:profile}=current?await current.client.from('profiles').select('username,avatar_url,role').eq('id',current.user.id).maybeSingle():{data:null};
  const preferences=parsePreferences((await cookies()).get(preferenceCookie)?.value);
  return <html lang="pt-BR" data-theme={preferences.theme} data-motion={preferences.motion} data-text-size={preferences.textSize} data-contrast={preferences.contrast} data-density={preferences.density}><body><PreferencesProvider initial={preferences}>
    <a className="skip" href="#main">Pular para o conteúdo</a>
    <Navigation signedIn={Boolean(current)} profile={profile?{username:profile.username,avatar:publicImage(profile.avatar_url,'avatars'),developer:profile.role==='developer'}:null}/>
    <main id="main">{children}</main>
    <footer className="footer"><div className="container footer-inner">
      <div><Brand/></div>
      <nav aria-label="Institucional"><Link href="/about">Sobre</Link><Link href="/support">Suporte</Link><Link href="/terms">Termos</Link><Link href="/privacy">Privacidade</Link></nav>
    </div></footer>
  </PreferencesProvider></body></html>;
}
