import { PackageUpload } from '@/components/package-upload';
import Link from 'next/link';
import { ActionForm } from '@/components/action-form';
import { GameForm } from '@/components/game-form';
import { PortalShell } from '@/components/portal-shell';
import { ownerGame } from '@/lib/portal-data';
import { saveDelivery, submitGame, requestUpdate } from '@/lib/portal-actions';
import { gameStatuses } from '@/lib/rules';

export const metadata={title:'Revisar jogo'};

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const {client,game,user}=await ownerGame(id,'edit');
  const {data:notes,error}=await client.rpc('get_game_moderation_notes',{p_game_id:id});
  if(error) throw new Error('Não foi possível consultar as notas de moderação.');
  const {data:delivery}=await client.from('game_delivery_intake').select('delivery_kind,source_url,package_path,entry_hint').eq('game_id',id).maybeSingle();
  const {data:admin}=await client.rpc('is_admin');
  const directPublish=user.id==='d85bf8a9-8e6c-469a-99cb-3ebbeec6b4cb'&&admin===true;
  const {data:updates}=await client.from('game_updates').select('id,status,notes,created_at').eq('game_id',id).order('created_at',{ascending:false});
  const editable=['draft','rejected'].includes(game.status);
  return <PortalShell kind="developer" title={game.title}>
    <div className="toolbar"><span className="pill">{gameStatuses[game.status]}</span><Link className="button secondary" href={'/developer/games/'+id+'/media'}>Mídias</Link></div>
    {notes && <div className="panel"><h2>Nota de moderação</h2><p className="preformatted">{notes}</p></div>}
    {editable ? <><div className="panel"><h2>Envie seu jogo</h2><PackageUpload id={id}/>{delivery?.package_path&&<p>ZIP recebido · {delivery.entry_hint||"Formato a confirmar"} · análise pendente</p>}<h3>Ou envie um link</h3><p className="muted">Cole o endereço do jogo hospedado ou um link de download do ZIP. O link será privado até a análise. Não envie senhas ou chaves.</p><ActionForm action={saveDelivery.bind(null,id)} label="Salvar jogo para análise"><label className="field">Formato<select name="delivery_kind" defaultValue={delivery?.delivery_kind??"web"}><option value="web">Jogo de navegador · link</option><option value="html_zip">HTML5 · link do ZIP</option><option value="windows_zip">Windows · link do ZIP</option></select></label><label className="field">Link HTTPS<input name="source_url" type="url" required maxLength={1000} defaultValue={delivery?.package_path?"":delivery?.source_url??""} placeholder="https://..."/></label></ActionForm></div>{directPublish&&<p className="muted">Publicação direta do Criador · sem aprovação manual.</p>}<GameForm game={game} canSubmit={Boolean(delivery)} directPublish={directPublish}/>{!delivery&&<p className="muted">Envie o ZIP ou salve o link do jogo para liberar o envio para análise.</p>}</> :
      <div className="panel"><p>{game.short_description || game.description}</p>{directPublish&&game.status==="pending"&&<ActionForm action={submitGame.bind(null,id)} label="Publicar jogo"/>}{game.status==='published'&&game.slug&&<div><Link className="button" href={'/game/'+encodeURIComponent(game.slug)}>Abrir página publicada</Link></div>}</div>}
  {game.status==='published'&&<section className="panel"><h2>Atualizar jogo publicado</h2><p>A versão atual permanece disponível durante a análise.</p><ActionForm action={requestUpdate.bind(null,id)} label="Enviar alterações"><label className="field">Título<input name="title" defaultValue={game.title} required maxLength={100}/></label><label className="field">Descrição<textarea name="description" defaultValue={game.description} required maxLength={15000}/></label><label className="field">O que mudou?<textarea name="notes" required maxLength={2000}/></label></ActionForm><h3>Histórico de alterações</h3>{updates?.map(u=><p key={u.id}>{u.status} · {u.notes}</p>)}</section>}</PortalShell>;
}
