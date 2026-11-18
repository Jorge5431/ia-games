import { ReviewPlayer } from '@/components/review-player';
import Image from 'next/image';
import { ActionForm, Notes } from '@/components/action-form';
import { PortalShell } from '@/components/portal-shell';
import { requireRole } from '@/lib/supabase';
import { moderateGame, reviewUpdate } from '@/lib/portal-actions';
import { gameDetailsFields, publicImage, type Game } from '@/lib/catalog';
import { httpsUrl, money } from '@/lib/rules';

export const metadata={title:'Moderação de jogos'};

export default async function Page() {
  const {client}=await requireRole('admin','/admin/moderation');
  const {data,error}=await client.from('games').select(gameDetailsFields+',game_media(id,media_url,media_type)').eq('status','pending').order('updated_at').limit(100);
  if(error) throw new Error('Não foi possível consultar a fila de moderação.');
  const games=data as unknown as (Game & {game_media:{id:string;media_url:string;media_type:string}[]})[];
  const {data:deliveries}=await client.from('game_delivery_intake').select('game_id,delivery_kind,source_url,package_path,entry_hint');
  const {data:updates}=await client.from('game_updates').select('id,title,description,notes,game_id').eq('status','pending');
  return <PortalShell kind="admin" title="Moderação de jogos">
    {!games.length && <div className="panel"><p>Nenhum jogo aguardando análise.</p></div>}
    {games.map(game=>{
      const image=publicImage(game.cover_url||game.banner_url);
      return <div className="panel" key={game.id} id={game.id}>
        <h2>{game.title}</h2><p className="muted">{game.genre} · {money.format(game.price)} · {game.platform?.join(', ')}</p>
        {image && <Image src={image} alt="Capa do jogo" width={240} height={135}/>}
        {game.description && <p className="preformatted">{game.description}</p>}
        {game.ai_disclosure && <div><h3>Uso de IA</h3><p className="preformatted">{game.ai_disclosure}</p></div>}
        <div className="toolbar">{game.game_media.map(media=>{
          const src=publicImage(media.media_url);
          return media.media_type==='screenshot'&&src ? <Image key={media.id} src={src} alt="Captura de tela" width={144} height={81}/> :
            media.media_type==='trailer'&&httpsUrl.safeParse(media.media_url).success?<a key={media.id} className="text-link" href={media.media_url} target="_blank" rel="noopener noreferrer">Abrir trailer</a>:null;
        })}</div>
        {(deliveries??[]).filter(d=>d.game_id===game.id).map(d=><div key={d.game_id}><h3>Arquivo ou link para análise</h3><p>{d.delivery_kind} · {d.package_path?"ZIP privado: "+d.package_path:d.source_url}</p>{d.entry_hint&&<p>Entrada detectada: {d.entry_hint}</p>}{d.delivery_kind==="web"&&!d.package_path&&httpsUrl.safeParse(d.source_url).success&&<ReviewPlayer url={d.source_url}/>}<p className="muted">Conteúdo não verificado. Não execute arquivos na máquina principal.</p></div>)}<ActionForm action={moderateGame.bind(null,game.id)} label="Registrar decisão">
          <label className="field">Decisão<select name="decision" defaultValue="" required><option value="">Selecione</option><option value="approve">Aprovar publicação</option><option value="reject">Rejeitar publicação</option></select></label>
          <Notes name="notes" label="Nota de moderação"/>
        </ActionForm>
      </div>;
    })}
  <h2>Atualizações de jogos publicados</h2>{updates?.map(u=><section className="panel" key={u.id}><h3>{u.title}</h3><p>{u.description}</p><p>{u.notes}</p><ActionForm action={reviewUpdate.bind(null,u.id,true)} label="Aprovar atualização"/><ActionForm action={reviewUpdate.bind(null,u.id,false)} label="Rejeitar atualização"/></section>)}</PortalShell>;
}
