import Link from 'next/link';
import { requireSession, roleOf } from '@/lib/supabase';
import { applyDeveloper } from '@/lib/player-actions';
import { ActionForm, Field, Notes } from '@/components/action-form';
import { AccountShell } from '@/components/account-shell';

export const metadata={title:'Acesso de desenvolvedor'};
const labels={pending:'Em análise',approved:'Aprovada',rejected:'Rejeitada'};

export default async function Page() {
  const {client,user}=await requireSession('/developer/apply');
  const [{data,error},role]=await Promise.all([
    client.from('developer_applications').select('studio_name,status').eq('user_id',user.id).maybeSingle(),roleOf(),
  ]);
  if(error) throw new Error('Não foi possível consultar sua solicitação.');
  return <AccountShell title="Acesso de desenvolvedor"><div className="panel">
    {role==='developer'||role==='admin' ? <div><Link className="button" href="/developer/dashboard">Abrir portal</Link></div> : data ?
      <p>Solicitação de {data.studio_name} · {labels[data.status as keyof typeof labels]}</p> :
      <ActionForm action={applyDeveloper} label="Enviar solicitação">
        <Field name="studio_name" label="Nome do estúdio" min={2} max={80} required/>
        <Notes name="description" label="Como você usa IA no desenvolvimento dos seus jogos?" required/>
        <Field name="portfolio_url" label="Portfólio (HTTPS)" type="url" max={500}/>
      </ActionForm>}
  </div></AccountShell>;
}
