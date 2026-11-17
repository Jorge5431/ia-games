import Link from 'next/link';
import { AccountShell } from './account-shell';
import { ActionForm } from './action-form';
import { Empty } from './catalog-view';
import { requireSession } from '@/lib/supabase';
import { updateWishlist } from '@/lib/player-actions';

const tables={library:'user_library',wishlist:'wishlists',purchases:'user_library'} as const;
const titles={library:'Biblioteca',wishlist:'Lista de desejos',purchases:'Histórico de compras'} as const;
const paths={library:'/library',wishlist:'/wishlist',purchases:'/account/purchases'} as const;
const empty={library:'Sua biblioteca está vazia.',wishlist:'Sua lista de desejos está vazia.',purchases:'Nenhuma compra registrada.'} as const;

export async function PlayerCollection({kind,search,genre}: {kind:keyof typeof tables;search?:string;genre?:string}) {
  const {client,user}=await requireSession(paths[kind]);
  let result=client.from(tables[kind]).select('id,game_id,games(id,title,slug,genre,status)').eq('user_id',user.id);
  if(kind==='purchases') result=result.eq('acquisition_type','purchase');
  result=result.order(kind==='wishlist'?'created_at':'acquired_at',{ascending:false});
  const {data,error}=await result;
  if(error) throw new Error('Não foi possível consultar esta coleção.');
  const rows=data.map(entry=>({...entry,game:entry.games as unknown as {title:string;slug:string|null;genre:string|null;status:string}|null}));
  const genres=Array.from(new Set(rows.flatMap(entry=>entry.game?.genre?[entry.game.genre]:[]))).sort();
  const normalized=search?.trim().toLocaleLowerCase('pt-BR');
  const visible=rows.filter(entry=>!normalized||entry.game?.title.toLocaleLowerCase('pt-BR').includes(normalized))
    .filter(entry=>!genre||entry.game?.genre===genre);
  return <AccountShell title={titles[kind]}>
    {kind==='library' && rows.length>0 && <form className="panel" action="/library"><div className="form-grid">
      <label className="field">Pesquisar biblioteca<input type="search" name="q" defaultValue={search} maxLength={80}/></label>
      <label className="field">Gênero<select name="genre" defaultValue={genre||''}><option value="">Todos</option>{genres.map(value=><option key={value}>{value}</option>)}</select></label>
      <button className="button">Filtrar</button></div></form>}
    {visible.length===0 ? <Empty title={rows.length?'Nenhum resultado':empty[kind]}><Link className="text-link" href="/store">Explorar loja</Link></Empty> :
      <div className="panel">{visible.map(({id,game_id,game})=><div className="row" key={id}>
        <div><h3>{game?.title || 'Jogo indisponível'}</h3>{game?.genre && <p className="muted">{game.genre}</p>}</div>
        <div className="toolbar">
          {game?.slug && game.status==='published' && <Link className="button secondary" href={'/game/'+encodeURIComponent(game.slug)}>Detalhes</Link>}
          {kind==='library' && game?.status==='published' && <Link className="button" href={'/downloads?game='+game_id}>Download</Link>}
          {kind==='wishlist' && <ActionForm action={updateWishlist.bind(null,game_id,false,'/wishlist')} label="Remover dos favoritos" secondary/>}
        </div>
      </div>)}</div>}
  </AccountShell>;
}
