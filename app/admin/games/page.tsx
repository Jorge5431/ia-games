import Link from 'next/link';
import { PortalShell } from '@/components/portal-shell';
import { requireRole } from '@/lib/supabase';
import { gameStatuses } from '@/lib/rules';

export const metadata={title:'Jogos cadastrados'};

export default async function Page() {
  const {client}=await requireRole('admin','/admin/games');
  const {data,error}=await client.from('games').select('id,title,slug,status').order('updated_at',{ascending:false}).limit(100);
  if(error) throw new Error('Não foi possível consultar os jogos.');
  return <PortalShell kind="admin" title="Jogos cadastrados"><div className="panel">
    {data.length?data.map(game=><div className="row" key={game.id}>
      <div><h3>{game.title}</h3><span className="pill">{gameStatuses[game.status as keyof typeof gameStatuses]}</span></div>
      {game.status==='published'&&game.slug&&<Link className="button secondary" href={'/game/'+encodeURIComponent(game.slug)}>Ver publicação</Link>}
      {game.status==='pending'&&<Link className="button" href={'/admin/moderation#'+game.id}>Analisar jogo</Link>}
    </div>):<p>Nenhum jogo cadastrado.</p>}
  </div></PortalShell>;
}
