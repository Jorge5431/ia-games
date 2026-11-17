import Link from 'next/link';
import { PortalShell } from '@/components/portal-shell';
import { first, type Query } from '@/lib/catalog';
import { requireRole } from '@/lib/supabase';

export const metadata={title:'Usuários'};
const roles={player:'Jogador',developer:'Desenvolvedor',admin:'Administrador'};

export default async function Page({searchParams}:{searchParams:Promise<Query>}) {
  const {client}=await requireRole('admin','/admin/users');
  const page=Math.max(1,Math.min(10000,Number.parseInt(first((await searchParams).page)||'1',10)||1));
  const {data,error,count}=await client.from('profiles').select('id,username,display_name,role',{count:'exact'}).order('created_at',{ascending:false}).order('id').range((page-1)*30,page*30-1);
  if(error) throw new Error('Não foi possível consultar os usuários.');
  return <PortalShell kind="admin" title="Usuários"><div className="panel">
    {data.length?data.map(profile=><div className="row" key={profile.id}><div><h3>{profile.display_name||'Jogador'}</h3>{profile.username && <p className="muted">@{profile.username}</p>}</div><span className="pill">{roles[profile.role as keyof typeof roles]}</span></div>):<p>Nenhum usuário nesta página.</p>}
    <div className="toolbar">{page>1 && <Link className="button secondary" href={'/admin/users?page='+(page-1)}>Anterior</Link>}
      {(count||0)>page*30 && <Link className="button secondary" href={'/admin/users?page='+(page+1)}>Próxima</Link>}</div>
  </div></PortalShell>;
}
