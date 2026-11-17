'use client';
import { useGentleMotion } from './preferences-provider';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, Search, Settings2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useLabel } from './preferences-provider';



export function Navigation({signedIn}: {signedIn:boolean}) {
  const path = usePathname();
  const t=useLabel();
  const primary=[['/store',t('Loja','Store','Tienda')],['/discover',t('Descobrir','Discover','Descubrir')],['/categories',t('Categorias','Categories','Categorías')]];
  const [openOn,setOpenOn] = useState<string|null>(null);
  const reduced = useGentleMotion();
  const open = openOn === path;
  const toggle = () => setOpenOn(open ? null : path);

  return <header className="site-header" onKeyDown={event => { if(event.key==='Escape') setOpenOn(null); }}>
    <div className="container header-inner">
      <Link href="/" className="brand" aria-label="Vornelix — início">
        <Image src="/simbolo-vornelix.webp" width={36} height={36} alt=""/>
        <span>VORNELIX</span>
      </Link>
      <nav className="desktop-nav" aria-label="Navegação principal">{primary.map(([href,label]) =>
        <Link href={href} key={href} aria-current={path===href ? 'page' : undefined}>
          {label}{path===href && <motion.span className="nav-active" layoutId={reduced ? undefined:'nav-active'}/>}
        </Link>
      )}</nav>
      <div className="header-actions"><Link className="icon-button" href="/settings" aria-label={t('Preferências','Preferences','Preferencias')}><Settings2 size={20}/></Link>
        <Link className="icon-button" href="/search" aria-label="Pesquisar"><Search size={20}/></Link>
        <Link className="button secondary desktop-account" href={signedIn ? '/account' : '/login'}>{signedIn ? t('Minha conta','My account','Mi cuenta') : t('Entrar','Sign in','Entrar')}</Link>
        <button className="icon-button mobile-toggle" type="button" aria-label={open ? 'Fechar menu mobile' : 'Abrir menu mobile'} aria-expanded={open} aria-controls="mobile-navigation" onClick={toggle}>{open ? <X/> : <Menu/>}</button>
      </div>
    </div>
    <AnimatePresence initial={false}>{open && <motion.nav id="mobile-navigation" className="mobile-nav" aria-label="Navegação mobile"
      initial={reduced ? false : {opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={reduced ? undefined : {opacity:0,y:-8}} transition={{duration:.18}}>
      {primary.map(([href,label]) => <Link key={href} href={href} onClick={() => setOpenOn(null)} aria-current={path===href ? 'page' : undefined}>{label}</Link>)}
      <Link href={signedIn ? '/account' : '/login'} onClick={() => setOpenOn(null)}>{signedIn ? t('Minha conta','My account','Mi cuenta') : t('Entrar','Sign in','Entrar')}</Link>
    </motion.nav>}</AnimatePresence>
  </header>;
}
