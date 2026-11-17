import { Metrics, PortalShell } from '@/components/portal-shell';
import { administrativeStats } from '@/lib/portal-data';
import { gameStatuses } from '@/lib/rules';

export const metadata={title:'Relatórios de moderação'};

export default async function Page() {
  const {client,counts}=await administrativeStats('/admin/reports');
  const [games,applications]=await Promise.all([
    client.from('game_moderation_history').select('id,status_from,status_to,notes,created_at,games(title)').order('created_at',{ascending:false}).limit(30),
    client.from('developer_applications').select('id,studio_name,status,reviewed_at').not('reviewed_at','is',null).order('reviewed_at',{ascending:false}).limit(30),
  ]);
  if(games.error||applications.error) throw new Error('Não foi possível carregar o histórico.');
  return <PortalShell kind="admin" title="Relatórios de moderação"><Metrics items={counts}/>
    <div className="panel"><h2>Histórico de jogos</h2>{games.data.length?games.data.map(entry=><div className="row" key={entry.id}>
      <div><h3>{(entry.games as unknown as {title:string}|null)?.title || 'Jogo'}</h3><p>{gameStatuses[entry.status_from as keyof typeof gameStatuses]} → {gameStatuses[entry.status_to as keyof typeof gameStatuses]}</p>
        {entry.notes && <p className="preformatted">{entry.notes}</p>}</div><time dateTime={entry.created_at}>{entry.created_at.slice(0,10).split('-').reverse().join('/')}</time>
    </div>):<p>Nenhuma ação de moderação registrada.</p>}</div>
    <div className="panel"><h2>Solicitações avaliadas</h2>{applications.data.length?applications.data.map(item=><div className="row" key={item.id}>
      <h3>{item.studio_name}</h3><span className="pill">{item.status==='approved'?'Aprovada':'Rejeitada'}</span>
    </div>):<p>Nenhuma solicitação avaliada.</p>}</div>
  </PortalShell>;
}
