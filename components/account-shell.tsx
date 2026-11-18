import Link from 'next/link';
import { roleOf } from '@/lib/supabase';
import { signOut } from '@/lib/auth-actions';
import { ActionForm } from './action-form';

export const accountLinks=[
  ['/account','Visão geral'],['/account/profile','Perfil'],['/account/settings','Configurações'],['/library','Biblioteca'],
  ['/wishlist','Lista de desejos'],['/account/reviews','Minhas avaliações'],['/account/purchases','Compras'],['/downloads','Downloads'],
] as const;

export async function AccountShell({title,children}: {title:string;children:React.ReactNode}) {
  const role = await roleOf();
  return <section className="container page account-clean"><h1>{title}</h1><div className="dashboard">
    <details className="account-menu"><summary>Menu da conta</summary><nav className="sidebar" aria-label="Minha conta">
      {accountLinks.map(([href,label])=><Link href={href} key={href}>{label}</Link>)}
      <Link href={role==='player'?'/developer/apply':'/developer/dashboard'}>{role==='player'?'Acesso de desenvolvedor':'Portal do desenvolvedor'}</Link>
      {role==='admin' && <Link href="/admin">Administração</Link>}
    </nav></details>
    <div className="page-section">{children}</div>
  </div></section>;
}

export function SignOut() {
  return <ActionForm action={signOut} label="Sair" secondary/>;
}
