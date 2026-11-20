import Link from 'next/link';
import { AccountShell } from '@/components/account-shell';
import { Empty } from '@/components/catalog-view';
import { ReviewForm } from '@/components/review-form';
import { requireSession } from '@/lib/supabase';

export const metadata={title:'Minhas avaliações'};

export default async function Page() {
  const {client,user}=await requireSession('/account/reviews');
  const {data,error}=await client.from('reviews').select('id,game_id,rating,comment,created_at,games(title,slug,status)')
    .eq('user_id',user.id).order('created_at',{ascending:false});
  if(error) throw new Error('Não foi possível consultar suas avaliações.');
  return <AccountShell title="Minhas avaliações">{data.length?data.map(review=>{
    const game=review.games as unknown as {title:string;slug:string;status:string}|null;
    return <div className="panel" key={review.id}>
      <h2>{game?.slug?<Link className="text-link" href={'/game/'+encodeURIComponent(game.slug)}>{game.title}</Link>:'Jogo indisponível'}</h2>
      <ReviewForm gameId={review.game_id} review={review} path="/account/reviews"/>
    </div>;
  }):<Empty title="Você ainda não avaliou jogos"><Link className="text-link" href="/library">Abrir biblioteca</Link></Empty>}</AccountShell>;
}
