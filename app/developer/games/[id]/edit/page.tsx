import Link from 'next/link';
import { ActionForm } from '@/components/action-form';
import { GameForm } from '@/components/game-form';
import { PortalShell } from '@/components/portal-shell';
import { ownerGame } from '@/lib/portal-data';
import { submitGame } from '@/lib/portal-actions';
import { gameStatuses } from '@/lib/rules';

export const metadata={title:'Revisar jogo'};

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const {client,game}=await ownerGame(id,'edit');
  const {data:notes,error}=await client.rpc('get_game_moderation_notes',{p_game_id:id});
  if(error) throw new Error('Não foi possível consultar as notas de moderação.');
  const editable=['draft','rejected'].includes(game.status);
  return <PortalShell kind="developer" title={game.title}>
    <div className="toolbar"><span className="pill">{gameStatuses[game.status]}</span><Link className="button secondary" href={'/developer/games/'+id+'/media'}>Mídias</Link></div>
    {notes && <div className="panel"><h2>Nota de moderação</h2><p className="preformatted">{notes}</p></div>}
    {editable ? <><GameForm game={game}/><ActionForm action={submitGame.bind(null,id)} label="Enviar para análise" secondary/></> :
      <div className="panel"><p>{game.short_description || game.description}</p>{game.status==='published'&&game.slug&&<div><Link className="button" href={'/game/'+encodeURIComponent(game.slug)}>Abrir página publicada</Link></div>}</div>}
  </PortalShell>;
}
