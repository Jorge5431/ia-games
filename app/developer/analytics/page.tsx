import { PortalShell } from '@/components/portal-shell';
import { developerGames } from '@/lib/portal-data';

export const metadata={title:'Avaliações dos meus jogos'};

export default async function Page() {
  const {client,user}=await developerGames('/developer/analytics');
  const {data,error}=await client.from('published_games_catalog').select('id,title,rating_average,review_count')
    .eq('developer_id',user.id).order('review_count',{ascending:false});
  if(error) throw new Error('Não foi possível consultar as avaliações.');
  return <PortalShell kind="developer" title="Avaliações dos meus jogos"><div className="panel">
    {data.length?data.map(game=><div className="row" key={game.id}><h3>{game.title}</h3><p>{game.rating_average==null?'Sem avaliações':Number(game.rating_average).toFixed(1).replace('.',',')+' de 5 · '+game.review_count+' avaliações'}</p></div>):<p>Nenhum jogo publicado.</p>}
  </div></PortalShell>;
}
