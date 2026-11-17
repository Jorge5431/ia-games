import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ActionForm } from '@/components/action-form';
import { claimGame } from '@/lib/player-actions';
import { publishedGame } from '@/lib/catalog';
import { ownsGame } from '@/lib/entitlements';
import { paymentAvailability } from '@/lib/payments';
import { requireSession } from '@/lib/supabase';
import { money, purchaseState, uuid } from '@/lib/rules';

export const metadata={title:'Finalizar aquisição'};

export default async function Page({params}: {params:Promise<{gameId:string}>}) {
  const {gameId}=await params;
  if(!uuid.safeParse(gameId).success) notFound();
  const {client,user}=await requireSession('/checkout/'+gameId);
  const [game,owned]=await Promise.all([publishedGame('id',gameId),ownsGame(client,user.id,gameId)]);
  if(!game) notFound();
  const state=purchaseState(true,owned,game.price);
  if(state==='owned') redirect('/library');
  const payment = paymentAvailability();
  return <section className="container page"><h1>Finalizar aquisição</h1>
    <div className="panel"><h2>Resumo do pedido</h2><div className="row"><span>{game.title}</span><strong>{money.format(game.price)}</strong></div>
      {state==='free'?<ActionForm action={claimGame.bind(null,gameId)} label="Adicionar à biblioteca"/>:payment.state==='unavailable' && <p role="status" className="muted">Os pagamentos ainda não estão disponíveis.</p>}
      <div><Link className="button secondary" href={game.slug?'/game/'+encodeURIComponent(game.slug):'/store'}>Voltar</Link></div>
    </div>
  </section>;
}
