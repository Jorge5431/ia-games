import Link from 'next/link';
import { PortalShell, Metrics } from '@/components/portal-shell';
import { developerGames } from '@/lib/portal-data';
import { gameStatuses } from '@/lib/rules';

export const metadata={title:'Painel do desenvolvedor'};

export default async function Page() {
  const {games,client,user}=await developerGames('/developer/dashboard');
  const stats=Object.entries(gameStatuses).map(([status,label])=>[label,games.filter(game=>game.status===status).length] as const);
  const {data:ratings,error}=await client.from('published_games_catalog').select('id,title,rating_average,review_count').eq('developer_id',user.id);
  const reviews=error?null:(ratings??[]).reduce((sum,g)=>sum+Number(g.review_count??0),0);
  return <PortalShell kind="developer" title="Painel do desenvolvedor"><p className="muted">Acompanhe seus jogos e gerencie suas publicações.</p><Metrics items={stats}/><div className="portal-telemetry"><div><strong>{reviews===null?"—":reviews}</strong><span>Avaliações recebidas</span></div>{["Jogadores únicos","Jogando agora","Downloads","Receita"].map(label=><div key={label}><strong>—</strong><span>{label}</span><small>Coleta ainda indisponível</small></div>)}</div>
    <div className="toolbar"><Link className="button" href="/developer/games/new">Cadastrar jogo</Link><Link className="button secondary" href="/developer/games">Meus jogos</Link></div><h2>Meus jogos</h2>{games.length?games.map(game=><div className="panel" key={game.id}><h3>{game.title}</h3><p>{gameStatuses[game.status as keyof typeof gameStatuses]}</p><Link href={"/developer/games/"+game.id+"/edit"}>Gerenciar jogo</Link></div>):<p className="muted">Você ainda não cadastrou jogos.</p>}
  </PortalShell>;
}
