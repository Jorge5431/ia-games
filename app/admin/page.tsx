import Link from 'next/link';
import { administrativeStats } from '@/lib/portal-data';
import { Metrics, PortalShell } from '@/components/portal-shell';

export const metadata={title:'Administração'};

export default async function Page() {
  const {counts}=await administrativeStats('/admin');
  return <PortalShell kind="admin" title="Painel do Criador"><p className="muted">Gerencie a comunidade e acompanhe a atividade da VORNELIX.</p><Metrics items={counts}/>
    <div className="toolbar"><Link className="button" href="/admin/moderation">Abrir moderação</Link><Link className="button secondary" href="/admin/developers">Revisar solicitações</Link></div><div className="portal-shortcuts"><Link href="/admin/users">Gerenciar usuários</Link><Link href="/admin/developers">Solicitações de desenvolvedores</Link><Link href="/admin/games">Gerenciar jogos</Link><Link href="/admin/reports">Relatórios</Link></div>
  </PortalShell>;
}
