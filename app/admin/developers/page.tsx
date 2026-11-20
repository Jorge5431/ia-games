import { PortalShell } from '@/components/portal-shell';
import { ActionForm } from '@/components/action-form';
import { requireRole } from '@/lib/supabase';
import { reviewDeveloper } from '@/lib/portal-actions';
import { httpsUrl } from '@/lib/rules';

export const metadata={title:'Solicitações de desenvolvedores'};
const statuses={pending:'Em análise',approved:'Aprovada',rejected:'Rejeitada'};

export default async function Page() {
  const {client}=await requireRole('admin','/admin/developers');
  const {data,error}=await client.from('developer_applications').select('id,studio_name,description,portfolio_url,status').order('status').order('created_at',{ascending:false}).limit(100);
  if(error) throw new Error('Não foi possível consultar as solicitações.');
  return <PortalShell kind="admin" title="Solicitações de desenvolvedores">
    {!data.length && <div className="panel"><p>Nenhuma solicitação cadastrada.</p></div>}
    {data.map(item=><div key={item.id} className="panel"><div className="section-title"><h2>{item.studio_name}</h2><span className="pill">{statuses[item.status as keyof typeof statuses]}</span></div>
      {item.description && <p className="preformatted">{item.description}</p>}
      {httpsUrl.safeParse(item.portfolio_url).success && <div><a className="text-link" href={item.portfolio_url} target="_blank" rel="noopener noreferrer">Abrir portfólio</a></div>}
      {item.status==='pending' && <div className="toolbar"><ActionForm action={reviewDeveloper.bind(null,item.id,true)} label="Aprovar"/><ActionForm action={reviewDeveloper.bind(null,item.id,false)} label="Rejeitar" secondary/></div>}
    </div>)}
  </PortalShell>;
}
