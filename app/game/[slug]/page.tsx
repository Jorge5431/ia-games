import { FallingText } from '@/components/falling-text';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { catalog, filters, isDirectVideoUrl, publicImage, publishedGame, type Media } from '@/lib/catalog';
import { categories, calculateRatings, httpsUrl, money } from '@/lib/rules';
import { db, session } from '@/lib/supabase';
import { ownsGame } from '@/lib/entitlements';
import { claimGame, updateWishlist } from '@/lib/player-actions';
import { ActionForm } from '@/components/action-form';
import { GameGrid } from '@/components/catalog-view';
import { Gallery } from '@/components/gallery';
import { ReviewForm, type Review } from '@/components/review-form';
import { Share } from '@/components/share';
import { GameDetailHero } from '@/components/game-detail-hero';

type Props={params:Promise<{slug:string}>};

export async function generateMetadata({params}:Props) {
  const {slug}=await params;
  const game=await publishedGame('slug',slug);
  if(!game) return {title:'Jogo'};
  const description=game.short_description||undefined;
  const image=publicImage(game.cover_url||game.banner_url);
  return {title:game.title,description,openGraph:{title:game.title,description,images:image?[{url:image}]:undefined}};
}

export default async function Page({params}:Props) {
  const {slug}=await params;
  const [game,current,client]=await Promise.all([publishedGame('slug',slug),session(),db()]);
  if(!game||!client) notFound();
  const path='/game/'+encodeURIComponent(slug);
  const category=categories.find(([,label])=>label===game.genre);
  const [media,comments,ratings,related,owned,wish,ownReview,developer]=await Promise.all([
    client.from('game_media').select('id,media_url,media_type,position').eq('game_id',game.id).order('position').limit(25),
    client.from('reviews').select('id,rating,comment,created_at').eq('game_id',game.id).order('created_at',{ascending:false}).limit(20),
    client.from('published_game_ratings').select('rating,quantity').eq('game_id',game.id).order('rating'),
    category?catalog(filters({genre:category[0]}),5):null,
    current?ownsGame(client,current.user.id,game.id):false,
    current?client.from('wishlists').select('id').eq('user_id',current.user.id).eq('game_id',game.id).maybeSingle():null,
    current?client.from('reviews').select('id,rating,comment,created_at').eq('user_id',current.user.id).eq('game_id',game.id).maybeSingle():null,
    client.rpc('published_game_developer',{p_game_id:game.id}),
  ]);
  if([media,comments,ratings,wish,ownReview,developer].some(result=>result?.error)) throw new Error('Não foi possível carregar os detalhes.');
  const stats=calculateRatings([]);
  for(const item of ratings.data||[]) {
    stats.distribution[item.rating-1]=Number(item.quantity);
    stats.count+=Number(item.quantity);
  }
  stats.average=stats.count?stats.distribution.reduce((total,count,i)=>total+count*(i+1),0)/stats.count:null;
  const assets=(media.data||[]) as Media[];
  const screenshots=assets.filter(item=>item.media_type==='screenshot').map(item=>publicImage(item.media_url)).filter((url):url is string=>Boolean(url));
  const mediaTrailers=assets.filter(item=>item.media_type==='trailer' && httpsUrl.safeParse(item.media_url).success);
  const gameplay=mediaTrailers.find(item=>isDirectVideoUrl(item.media_url))?.media_url||null;
  const trailers=mediaTrailers.filter(item=>!isDirectVideoUrl(item.media_url));
  const poster=publicImage(game.banner_url||game.cover_url);
  const cover=publicImage(game.cover_url||game.banner_url);
  const relatedGames=related?.games.filter(item=>item.id!==game.id).slice(0,4)||[];
  const detailFields=[
    ['Desenvolvedor',developer.data],['Gênero',game.genre],['Plataformas',game.platform?.join(', ')],
    ['Idiomas',game.languages?.join(', ')],['Lançamento',game.release_date ? new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC'}).format(new Date(game.release_date)) : null],
  ];
  const ratingLabel=stats.average===null?'Sem avaliações':stats.average.toFixed(1).replace('.',',')+' · '+stats.count+(stats.count===1?' avaliação':' avaliações');
  const delivery=current&&game.price===0?await client.from('game_delivery_intake').select('game_id').eq('game_id',game.id).in('delivery_kind',['web','html_zip']).maybeSingle():null;
  const purchase=<>
    {delivery?.data&&<Link className="button" href={'/play/'+game.id}>Jogar agora</Link>}
    <div className="detail-price">{game.price===0?<span>Gratuito</span>:<span>{money.format(game.price)}</span>}</div>
    {delivery?.data ? null : owned ? <Link className="button" href={'/downloads?game='+game.id}>Download</Link> : current && game.price===0 ?
      <ActionForm action={claimGame.bind(null,game.id)} label="Adicionar à biblioteca"/> :
      <Link className="button" href={'/checkout/'+game.id}>{game.price===0?'Adicionar à biblioteca':'Comprar'}</Link>}
  </>;
  return <article className="container page detail-page">
    <GameDetailHero title={game.title} genre={game.genre} description={game.short_description} cover={cover} poster={poster} gameplay={gameplay} rating={ratingLabel} platforms={game.platform||[]} purchase={purchase}/>
    <div className="detail-grid">
      <div className="page-section detail-main-column">
        <Gallery images={screenshots} title={game.title}/>
        {trailers.length>0 && <section className="toolbar detail-reveal">{trailers.map((item,index)=><a key={item.id} className="button secondary" href={item.media_url} target="_blank" rel="noopener noreferrer">Assistir ao trailer{trailers.length>1?' '+(index+1):''}</a>)}</section>}
        {game.description && <section className="panel detail-reveal"><h2><FallingText text={"Sobre o jogo"}/></h2><p className="preformatted">{game.description}</p></section>}
        {(game.minimum_requirements||game.recommended_requirements) && <section className="panel detail-reveal"><h2><FallingText text={"Requisitos do sistema"}/></h2>
          {game.minimum_requirements && <><h3><FallingText text={"Mínimos"}/></h3><p className="preformatted">{game.minimum_requirements}</p></>}
          {game.recommended_requirements && <><h3><FallingText text={"Recomendados"}/></h3><p className="preformatted">{game.recommended_requirements}</p></>}
        </section>}
        {game.ai_disclosure && <section className="panel detail-reveal"><h2><FallingText text={"Uso de inteligência artificial"}/></h2><p className="preformatted">{game.ai_disclosure}</p></section>}
        <section className="panel detail-reveal"><h2><FallingText text={"Avaliações"}/></h2>
          <p className="rating"><Star size={18}/>{stats.average===null?'Sem avaliações':stats.average.toFixed(1).replace('.',',')+' · '+stats.count+(stats.count===1?' avaliação':' avaliações')}</p>
          {stats.count>0 && <ul className="muted">{stats.distribution.map((quantity,index)=><li key={index}>{index+1} {index===0?'estrela':'estrelas'} · {quantity}</li>).reverse()}</ul>}
          {owned && <ReviewForm gameId={game.id} review={ownReview?.data as Review|undefined} path={path}/>}
          {(comments.data||[]).map(review=><div key={review.id} className="row"><p className="preformatted">{review.comment || 'Avaliação sem comentário'}</p><span className="pill">{review.rating}/5</span></div>)}
        </section>
      </div>
      <aside className="panel detail-sidebar">
        <h2><FallingText text={"Informações"}/></h2>
        {current ? <ActionForm action={updateWishlist.bind(null,game.id,!wish?.data,path)} label={wish?.data?'Remover dos favoritos':'Adicionar aos favoritos'} secondary/> :
          <Link className="button secondary" href={'/login?next='+encodeURIComponent(path)}>Adicionar aos favoritos</Link>}
        {!owned&&!delivery?.data&&<Link className="button secondary" href={'/downloads?game='+game.id}>Download</Link>}
        <Share title={game.title}/>
        <dl>{detailFields.filter(([,value])=>value).map(([label,value])=><div key={label} className="row"><dt className="muted">{label}</dt><dd>{value}</dd></div>)}</dl>
      </aside>
    </div>
    {relatedGames.length>0 && <section className="page-section detail-reveal"><h2><FallingText text={"Jogos relacionados"}/></h2><GameGrid games={relatedGames}/></section>}
  </article>;
}
