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
  const telemetry=await client.rpc('telemetry_stats');
  const rows=(telemetry.data??[]) as {game_id:string;players:number;playing:number;sessions:number;average_seconds:number;players_7d:number;players_30d:number}[];
  const sum=(key:'playing'|'sessions')=>telemetry.error?'—':rows.reduce((n,row)=>n+Number(row[key]),0);
  return <PortalShell kind="developer" title="Painel do desenvolvedor"><p className="muted">Acompanhe seus jogos e gerencie suas publicações.</p><Metrics items={stats}/><div className="portal-telemetry"><div><strong>{reviews===null?"—":reviews}</strong><span>Avaliações recebidas</span></div><div><strong>{sum("playing")}</strong><span>Soma de jogadores ativos por jogo</span></div><div><strong>{sum("sessions")}</strong><span>Sessões registradas</span></div>{["Downloads","Receita"].map(label=><div key={label}><strong>—</strong><span>{label}</span><small>Coleta ainda indisponível</small></div>)}</div>
    <div className="toolbar"><Link className="button" href="/developer/games/new">Cadastrar jogo</Link><Link className="button secondary" href="/developer/games">Meus jogos</Link></div><p className="muted">Atividade estimada pelos sinais dos jogos integrados nos últimos 120 segundos. Atualize a página para consultar novos dados.</p><Link href="/telemetry-sdk.js" download>Baixar SDK JavaScript</Link><Link href="/telemetry-guide.txt" download>Guia de integração</Link><h2>Meus jogos</h2>{games.length?games.map(game=><div className="panel" key={game.id}><h3>{game.title}</h3><p>{gameStatuses[game.status as keyof typeof gameStatuses]}</p>{rows.filter(row=>row.game_id===game.id).map(row=><div key={row.game_id}><p>Jogadores únicos: {row.players} · Jogando agora: {row.playing} · Sessões: {row.sessions}</p><p>Últimos 7 dias: {row.players_7d} · 30 dias: {row.players_30d} · Média: {Math.round(Number(row.average_seconds)/60)} min</p></div>)}<Link href={"/developer/games/"+game.id+"/edit"}>Gerenciar jogo</Link></div>):<p className="muted">Você ainda não cadastrou jogos.</p>}
  </PortalShell>;
}
