'use client';
import { Brand } from './brand';
import Link from 'next/link';
import { CheckCircle2, Mail } from 'lucide-react';
import { useLabel } from './preferences-provider';

export function EmailConfirmed({confirmed,next}:{confirmed:boolean;next:string}){
  const t=useLabel();
  return <section className="container page confirmation-page"><div className="confirmation-card confirmation-clean"><Brand/>
    <div className="confirmation-symbol">{confirmed?<CheckCircle2 size={48}/>:<Mail size={48}/>}</div>
    
    <h1>{confirmed?t('E-mail confirmado!','Email confirmed!','¡Correo confirmado!'):t('Entre para continuar','Sign in to continue','Inicia sesión para continuar')}</h1>
    <p className="muted">{confirmed?t('Tudo certo. Sua conta está pronta para explorar novos universos.','All set. Your account is ready to explore new worlds.','Todo listo. Tu cuenta está lista para explorar nuevos universos.'):t('Se você já confirmou o e-mail, entre com sua senha. Se o link expirou, solicite um novo e-mail pelo cadastro.','If you have confirmed your email, sign in with your password. If the link expired, request a new email through registration.','Si confirmaste tu correo, inicia sesión con tu contraseña. Si el enlace caducó, solicita otro correo desde el registro.')}</p>
    <div className="toolbar"><Link className="button" href={confirmed?'/account':'/login?next='+encodeURIComponent(next)}>{confirmed?t('Continuar para minha conta','Continue to my account','Continuar a mi cuenta'):t('Entrar','Sign in','Entrar')}</Link><Link className="button secondary" href="/store">{t('Explorar loja','Explore store','Explorar tienda')}</Link></div>
  </div></section>;
}
