import { ActionForm } from '@/components/action-form';
import { unpublishGame } from '@/lib/portal-actions';
import Link from 'next/link';
import { PortalShell } from '@/components/portal-shell';
import { requireRole } from '@/lib/supabase';
import { gameStatuses } from '@/lib/rules';

export const metadata={title:'Jogos cadastrados'};

export default async function Page() {
  const {client,user}=await requireRole('admin','/admin/games');
  const {data,error}=await client.from('games').select('id,title,slug,status').order('updated_at',{ascending:false}).limit(100);
  if(error) throw new Error('Não foi possível consultar os jogos.');
  return <PortalShell kind="admin" title="Jogos cadastrados"><div className="panel">
    {data.length?data.map(game=><div className="row" key={game.id}>
      <div><h3>{game.title}</h3><span className="pill">{gameStatuses[game.status as keyof typeof gameStatuses]}</span></div>
      {game.status==='published'&&game.slug&&<Link className="button secondary" href={'/game/'+encodeURIComponent(game.slug)}>Ver publicação</Link>}
      {game.status==='pending'&&<Link className="button" href={'/admin/moderation#'+game.id}>Analisar jogo</Link>}
      {game.status==='published'&&user.id==='d85bf8a9-8e6c-469a-99cb-3ebbeec6b4cb'&&<details><summary className="text-link">Remover do catálogo</summary><ActionForm action={unpublishGame.bind(null,game.id)} label="Confirmar remoção" secondary><label><input type="checkbox" name="confirm" value="yes" required/> Confirmo que o jogo ficará indisponível na loja.</label></ActionForm></details>}
    </div>):<p>Nenhum jogo cadastrado.</p>}
  </div></PortalShell>;
}
