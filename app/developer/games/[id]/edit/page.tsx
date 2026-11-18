import { PackageUpload } from '@/components/package-upload';
import Link from 'next/link';
import { ActionForm } from '@/components/action-form';
import { GameForm } from '@/components/game-form';
import { PortalShell } from '@/components/portal-shell';
import { ownerGame } from '@/lib/portal-data';
import { submitGame, saveDelivery } from '@/lib/portal-actions';
import { gameStatuses } from '@/lib/rules';

export const metadata={title:'Revisar jogo'};

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const {client,game}=await ownerGame(id,'edit');
  const {data:notes,error}=await client.rpc('get_game_moderation_notes',{p_game_id:id});
  if(error) throw new Error('Não foi possível consultar as notas de moderação.');
  const {data:delivery}=await client.from('game_delivery_intake').select('delivery_kind,source_url,package_path,entry_hint').eq('game_id',id).maybeSingle();
  const editable=['draft','rejected'].includes(game.status);
  return <PortalShell kind="developer" title={game.title}>
    <div className="toolbar"><span className="pill">{gameStatuses[game.status]}</span><Link className="button secondary" href={'/developer/games/'+id+'/media'}>Mídias</Link></div>
    {notes && <div className="panel"><h2>Nota de moderação</h2><p className="preformatted">{notes}</p></div>}
    {editable ? <><div className="panel"><h2>Envie seu jogo</h2><PackageUpload id={id}/>{delivery?.package_path&&<p>ZIP recebido · {delivery.entry_hint||"Formato a confirmar"} · análise pendente</p>}<h3>Ou envie um link</h3><p className="muted">Cole o endereço do jogo hospedado ou um link de download do ZIP. O link será privado até a análise. Não envie senhas ou chaves.</p><ActionForm action={saveDelivery.bind(null,id)} label="Salvar jogo para análise"><label className="field">Formato<select name="delivery_kind" defaultValue={delivery?.delivery_kind??"web"}><option value="web">Jogo de navegador · link</option><option value="html_zip">HTML5 · link do ZIP</option><option value="windows_zip">Windows · link do ZIP</option></select></label><label className="field">Link HTTPS<input name="source_url" type="url" required maxLength={1000} defaultValue={delivery?.package_path?"":delivery?.source_url??""} placeholder="https://..."/></label></ActionForm></div><GameForm game={game}/>{delivery?<ActionForm action={submitGame.bind(null,id)} label="Enviar para análise" secondary/>:<p className="muted">Salve o link do jogo antes de enviar para análise.</p>}</> :
      <div className="panel"><p>{game.short_description || game.description}</p>{game.status==='published'&&game.slug&&<div><Link className="button" href={'/game/'+encodeURIComponent(game.slug)}>Abrir página publicada</Link></div>}</div>}
  </PortalShell>;
}
