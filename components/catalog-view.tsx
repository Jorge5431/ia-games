import { FallingText } from '@/components/falling-text';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { catalog, filters, isDirectVideoUrl, PAGE_SIZE, type Game, type Query } from '@/lib/catalog';
import { categories, platforms } from '@/lib/rules';
import { db } from '@/lib/supabase';
import { GameCard } from './game-card';

export const emptyCatalogMessage = 'Novos universos estão sendo criados. Em breve, descubra os primeiros jogos da Vornelix.';

export function Categories() {
  return <div className="category-grid panoramic-categories">{categories.map(([slug,label])=><Link href={'/category/'+slug} key={slug} className={'category-panorama category-'+slug}><span>{label}</span><ArrowRight size={15}/></Link>)}</div>;
}

export async function GameGrid({games,tilt=false}: {games:Game[];tilt?:boolean}) {
  const client=games.length?await db():null;
  const previews=new Map<string,string>();
  if(client){const {data}=await client.from("game_media").select("game_id,media_url").eq("media_type","trailer").in("game_id",games.map(g=>g.id)).order("position").order("id");for(const item of data||[]){if(!previews.has(item.game_id)&&isDirectVideoUrl(item.media_url))previews.set(item.game_id,item.media_url);}}
  return <div className="card-grid">{games.map((game,index)=><GameCard game={game} preview={previews.get(game.id)} index={index} tilt={tilt && index < 4} key={game.id}/>)}</div>;
}

export function Empty({title,children}: {title:string;children?:React.ReactNode}) {
  return <div className="empty"><h2><FallingText text={title}/></h2>{children && <div className="muted">{children}</div>}</div>;
}

export async function CatalogView({title,params,categorySlug,path='/store'}: {title:string;params:Query;categorySlug?:string;path?:string}) {
  const query=filters(categorySlug?{...params,genre:categorySlug}:params);
  const {games,count,offline}=await catalog(query);
  const last=Math.max(1,Math.ceil(count/PAGE_SIZE));
  function pageUrl(page:number) {
    const queryParams=new URLSearchParams();
    if(query.q) queryParams.set('q',query.q);
    if(query.category&&!categorySlug) queryParams.set('genre',query.category[0]);
    if(query.platform) queryParams.set('platform',query.platform);
    if(query.price) queryParams.set('price',query.price);
    if(query.rating) queryParams.set('rating',String(query.rating));
    if(query.order) queryParams.set('order',query.order);
    queryParams.set('page',String(page));
    return path+'?'+queryParams.toString();
  }
  return <section className="container page"><h1><FallingText text={title}/></h1>
    <form action={path} className="panel">
      <div className="filter-grid">
        <label className="field">Pesquisar<input name="q" type="search" placeholder="Nome ou descrição" maxLength={80} defaultValue={query.q}/></label>
        {!categorySlug && <label className="field">Gênero<select name="genre" defaultValue={query.category?.[0]||''}><option value="">Todos</option>{categories.map(([slug,label])=><option value={slug} key={slug}>{label}</option>)}</select></label>}
        <label className="field">Plataforma<select name="platform" defaultValue={query.platform||''}><option value="">Todas</option>{platforms.map(platform=><option key={platform}>{platform}</option>)}</select></label>
        <label className="field">Preço<select name="price" defaultValue={query.price||''}><option value="">Todos</option><option value="free">Gratuitos</option><option value="paid">Pagos</option></select></label>
        <label className="field">Nota mínima<select name="rating" defaultValue={query.rating?.toString()||''}><option value="">Todas</option>{[1,2,3,4,5].map(number=><option value={number} key={number}>{number} {number===1?'estrela':'estrelas'}</option>)}</select></label>
        <label className="field">Ordenar<select name="order" defaultValue={query.order||''}><option value="">Lançamentos recentes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option><option value="rating">Melhor avaliação</option><option value="popular">Mais avaliados</option></select></label>
      </div>
      <div className="toolbar"><button className="button" type="submit"><Search size={17}/>Aplicar filtros</button><Link className="button secondary" href={path}>Limpar</Link></div>
    </form>
    {offline ? <Empty title="Catálogo indisponível">Tente novamente em instantes.</Empty> : games.length ? <GameGrid games={games} tilt/> : <Empty title="Nenhum jogo encontrado">{query.q||query.category||query.price||query.platform||query.rating?'Experimente ajustar os filtros.':emptyCatalogMessage}</Empty>}
    {!offline && (last>1 || query.page>1) && <nav className="toolbar" aria-label="Paginação">
      {query.page>1 && <Link className="button secondary" href={pageUrl(Math.min(query.page-1,last))}>Anterior</Link>}
      <span className="muted">Página {query.page} de {last}</span>
      {query.page<last && <Link className="button secondary" href={pageUrl(query.page+1)}>Próxima</Link>}
    </nav>}
  </section>;
}
