'use client';
import { useGentleMotion } from './preferences-provider';

import Link from 'next/link';
import { Brand } from './brand';
import { usePathname } from 'next/navigation';
import { EllipsisVertical, Search, Settings2, UserRound, Crown, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLabel } from './preferences-provider';



export function Navigation({signedIn,profile}: {signedIn:boolean;profile?:{username:string;avatar:string|null;developer:boolean;creator?:boolean}|null}) {
  const path = usePathname();
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{const update=()=>setScrolled(window.scrollY>48);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);},[]);
  const t=useLabel();
  const primary=[['/store',t('Loja','Store','Tienda')],['/discover',t('Descobrir','Discover','Descubrir')],['/categories',t('Categorias','Categories','Categorías')]];
  const [openOn,setOpenOn] = useState<string|null>(null);
  const reduced = useGentleMotion();
  const open = openOn === path;
  const toggle = () => setOpenOn(open ? null : path);

  return <header className={`site-header${path==='/'?' cinematic-header':''}${scrolled?' is-scrolled':''}`} onKeyDown={event => { if(event.key==='Escape') setOpenOn(null); }}>
    <div className="container header-inner">
      <Brand/>
      <nav className="desktop-nav" aria-label="Navegação principal">{primary.map(([href,label]) =>
        <Link href={href} key={href} aria-current={path===href ? 'page' : undefined}>
          {label}{path===href && <motion.span className="nav-active" layoutId={reduced ? undefined:'nav-active'}/>}
        </Link>
      )}</nav>
      <div className="header-actions">
        {signedIn&&profile?<Link className="header-profile" href="/account" aria-label="Minha conta">{profile.avatar?<img src={profile.avatar} alt="" className="header-avatar"/>:<span className="header-avatar"><UserRound size={20}/></span>}<span className="header-profile-text"><strong>{profile.username}</strong>{profile.creator?<small><Crown size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>CRIADOR</small>:profile.developer&&<small>DESENVOLVEDOR</small>}</span></Link>:<Link className="button secondary desktop-account" href={signedIn ? '/account' : '/login'}>{signedIn ? t('Minha conta','My account','Mi cuenta') : t('Entrar','Sign in','Entrar')}</Link>}
        <button className="icon-button mobile-toggle compact-menu-toggle" type="button" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={toggle}>{open ? <X/> : <EllipsisVertical size={20}/>}</button>
      </div>
    </div>
    <AnimatePresence initial={false}>{open && <motion.nav id="mobile-navigation" className="mobile-nav compact-menu" aria-label="Menu de navegação"
      initial={reduced ? false : {opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={reduced ? undefined : {opacity:0,y:-8}} transition={{duration:.18}}>
      {primary.map(([href,label]) => <Link key={href} href={href} onClick={() => setOpenOn(null)} aria-current={path===href ? 'page' : undefined}>{label}</Link>)}
      <Link href="/settings" onClick={() => setOpenOn(null)}><Settings2 size={17}/> {t("Configurações","Settings","Configuración")}</Link>
      {path!=="/"&&<Link href="/search" onClick={() => setOpenOn(null)}><Search size={17}/> {t("Pesquisar","Search","Buscar")}</Link>}
      <Link href={signedIn ? '/account' : '/login'} onClick={() => setOpenOn(null)}>{signedIn ? t('Minha conta','My account','Mi cuenta') : t('Entrar','Sign in','Entrar')}</Link>
    </motion.nav>}</AnimatePresence>
  </header>;
}
