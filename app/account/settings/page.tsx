import Link from 'next/link';
import { requireSession } from '@/lib/supabase';
import { AccountShell, SignOut } from '@/components/account-shell';

export const metadata={title:'Configurações'};

export default async function Page() {
  const {user}=await requireSession('/account/settings');
  return <AccountShell title="Configurações"><div className="panel"><h2>Segurança da conta</h2><p>{user.email}</p>
    <div className="toolbar"><Link className="button" href="/reset-password">Alterar senha</Link><SignOut/></div>
  </div></AccountShell>;
}
