import Link from 'next/link';
import { PortalShell } from '@/components/portal-shell';
import { developerGames } from '@/lib/portal-data';
import { gameStatuses } from '@/lib/rules';

export const metadata={title:'Envios para moderação'};

export default async function Page() {
  const {client,games}=await developerGames('/developer/submissions');
  const {data,error}=await client.from('game_moderation_history').select('id,game_id,status_from,status_to,notes,created_at').order('created_at',{ascending:false}).limit(100);
  if(error) throw new Error('Não foi possível consultar o histórico de análise.');
  const ownGames=new Map(games.map(game=>[game.id,game.title]));
  const history=data.filter(entry=>ownGames.has(entry.game_id));
  return <PortalShell kind="developer" title="Envios para moderação"><div className="panel">
    {history.length?history.map(entry=><div className="row" key={entry.id}>
      <div><h3>{ownGames.get(entry.game_id)}</h3><p className="muted">{gameStatuses[entry.status_to as keyof typeof gameStatuses]} · {new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo'}).format(new Date(entry.created_at))}</p>
        {entry.notes && <p className="preformatted">{entry.notes}</p>}</div>
      <Link className="button secondary" href={'/developer/games/'+entry.game_id+'/edit'}>Ver jogo</Link>
    </div>):<p>Nenhum envio registrado.</p>}
  </div></PortalShell>;
}
