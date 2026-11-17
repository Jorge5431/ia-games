import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { first, type Query } from '@/lib/catalog';
import { assessDownload } from '@/lib/entitlements';
import { uuid } from '@/lib/rules';
import { requireSession } from '@/lib/supabase';

export const metadata={title:'Downloads'};

const messages={
  pending:'O arquivo aguarda verificação de segurança.',
  missing:'O download deste jogo ainda está indisponível.',
  disabled:'A distribuição de arquivos será liberada posteriormente.',
  authorize:'Seu arquivo está pronto para baixar.',
  unavailable:'Este jogo não está disponível.',
  acquire:'Adquira o jogo antes de acessar o download.',
};

export default async function Page({searchParams}: {searchParams:Promise<Query>}) {
  const gameId=first((await searchParams).game);
  const {client,user}=await requireSession('/downloads'+(gameId?'?game='+encodeURIComponent(gameId):''));
  if(gameId) {
    if(!uuid.safeParse(gameId).success) notFound();
    const {state,game,url}=await assessDownload(client,user.id,gameId);
    if(state==='unavailable') notFound();
    if(state==='acquire') redirect('/checkout/'+gameId);
    return <section className="container page"><h1>Downloads</h1><div className="panel"><h2>{game?.title}</h2><p role="status">{messages[state]}</p>
      {url && <div><a className="button" href={url}>Baixar arquivo aprovado</a></div>}
      <div><Link className="button secondary" href="/downloads">Voltar aos downloads</Link></div>
    </div></section>;
  }
  const {data,error}=await client.from('user_library').select('game_id,games!inner(id,title,status)')
    .eq('user_id',user.id).eq('games.status','published').order('acquired_at',{ascending:false});
  if(error) throw new Error('Não foi possível carregar os downloads.');
  return <section className="container page"><h1>Downloads</h1><div className="panel">
    {data.length?data.map(entry=>{
      const game=entry.games as unknown as {title:string};
      return <div className="row" key={entry.game_id}><span>{game.title}</span><Link className="button secondary" href={'/downloads?game='+entry.game_id}>Ver disponibilidade</Link></div>;
    }):<p>Nenhum jogo na sua biblioteca.</p>}
    <div><Link className="text-link" href="/library">Abrir biblioteca</Link></div>
  </div></section>;
}
