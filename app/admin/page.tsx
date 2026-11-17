import Link from 'next/link';
import { administrativeStats } from '@/lib/portal-data';
import { Metrics, PortalShell } from '@/components/portal-shell';

export const metadata={title:'Administração'};

export default async function Page() {
  const {counts}=await administrativeStats('/admin');
  return <PortalShell kind="admin" title="Administração"><Metrics items={counts}/>
    <div className="toolbar"><Link className="button" href="/admin/moderation">Abrir moderação</Link><Link className="button secondary" href="/admin/developers">Revisar solicitações</Link></div>
  </PortalShell>;
}
