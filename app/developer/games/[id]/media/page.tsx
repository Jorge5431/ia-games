import Image from 'next/image';
import { ImageField } from '@/components/image-field';
import Link from 'next/link';
import { ActionForm, Field } from '@/components/action-form';
import { PortalShell } from '@/components/portal-shell';
import { ownerGame } from '@/lib/portal-data';
import { editMedia, removeMedia } from '@/lib/portal-actions';
import { publicImage } from '@/lib/catalog';
import { httpsUrl } from '@/lib/rules';

export const metadata={title:'Mídias do jogo'};

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const {client,game}=await ownerGame(id,'media');
  const {data,error}=await client.from('game_media').select('id,media_type,media_url').eq('game_id',id).order('position').order('id');
  if(error) throw new Error('Não foi possível carregar as mídias.');
  const editable=['draft','rejected'].includes(game.status);
  const uploads=[['cover_url','Capa','Enviar capa'],['banner_url','Banner','Enviar banner'],['screenshot','Capturas de tela','Enviar captura de tela']] as const;
  return <PortalShell kind="developer" title="Mídias do jogo">
    <div><Link className="button secondary" href={'/developer/games/'+id+'/edit'}>Voltar para {game.title}</Link></div>
    {uploads.map(([kind,title,label])=>{
      const image=kind==='screenshot'?null:publicImage(game[kind]);
      return <div className="panel" key={kind}><h2>{title}</h2>
        {image && <Image src={image} alt={title} width={224} height={126}/>}
        {editable && (game.status==='draft'||kind==='screenshot') && <ActionForm action={editMedia.bind(null,id,kind)} label={label}>
          <ImageField/>
        </ActionForm>}
      </div>;
    })}
    {editable && <div className="panel"><h2>Trailer e vídeo de fundo</h2>
      <p className="muted">Adicione um link HTTPS de trailer. Vídeos MP4 ou WebM diretos também podem ser usados como fundo cinematográfico da página do jogo; a capa será exibida enquanto o vídeo carrega.</p>
      <ActionForm action={editMedia.bind(null,id,'trailer')} label="Salvar vídeo"><Field name="url" label="Link HTTPS do vídeo (MP4 ou WebM para o fundo)" type="url" max={500} placeholder="https://estudio.com/gameplay.mp4" required/></ActionForm>
    </div>}
    {data.length>0 && <div className="panel"><h2>Mídias cadastradas</h2>{data.map(item=>{
      const image=publicImage(item.media_url);
      return <div key={item.id} className="row">
        {item.media_type==='screenshot'&&image ? <Image src={image} alt="Captura de tela" width={160} height={90}/> :
          item.media_type==='trailer'&&httpsUrl.safeParse(item.media_url).success ? <a className="text-link" href={item.media_url} target="_blank" rel="noopener noreferrer">{item.media_url.match(/\.(mp4|webm)(?:\?|$)/i)?'Vídeo de fundo · abrir arquivo':'Abrir trailer'}</a> : <p>Mídia indisponível</p>}
        {editable && <ActionForm action={removeMedia.bind(null,id,item.id)} label="Remover mídia" secondary/>}
      </div>;
    })}</div>}
  </PortalShell>;
}
