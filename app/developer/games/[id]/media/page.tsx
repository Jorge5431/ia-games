import Image from 'next/image';
import { VideoUpload } from '@/components/video-upload';
import { GameImageUpload } from '@/components/game-image-upload';
import Link from 'next/link';
import { ActionForm, Field } from '@/components/action-form';
import { PortalShell } from '@/components/portal-shell';
import { ownerGame } from '@/lib/portal-data';
import { editMedia, removeMedia } from '@/lib/portal-actions';
import { GameplayPreview } from '@/components/gameplay-preview';
import { publicImage, isDirectVideoUrl } from '@/lib/catalog';
import { httpsUrl } from '@/lib/rules';

export const metadata={title:'Mídias do jogo'};

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const {client,game}=await ownerGame(id,'media');
  const {data,error}=await client.from('game_media').select('id,media_type,media_url').eq('game_id',id).order('position').order('id');
  if(error) throw new Error('Não foi possível carregar as mídias.');
  const editable=['draft','rejected'].includes(game.status);
  const uploads=[['cover_url','Capa','Enviar capa'],['banner_url','Banner','Enviar banner']] as const;
  const preview=data.find(item=>item.media_type==='trailer'&&isDirectVideoUrl(item.media_url))?.media_url;
  return <PortalShell kind="developer" title="2. Identidade visual e gameplay">
    <p className="muted">As mídias abaixo são usadas na loja e na página do jogo. Salve cada arquivo para atualizar a prévia.</p>
    <div className="publication-editor"><article className="game-card"><div className="game-cover">{publicImage(game.cover_url)?<Image src={publicImage(game.cover_url)!} alt="Capa do jogo" fill sizes="300px"/>:<span>Sem capa</span>}</div><div className="game-card-text"><h3>{game.title}</h3><p>{game.price===0?"Gratuito":game.price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</p></div>{preview&&<GameplayPreview url={preview}/>}</article><div className="publication-banner" style={publicImage(game.banner_url)?{backgroundImage:"linear-gradient(0deg,#080808,transparent),url("+JSON.stringify(publicImage(game.banner_url))+")"}:undefined}><h2>{game.title}</h2><p>{game.short_description}</p></div></div>
    <div><Link className="button secondary" href={'/developer/games/'+id+'/edit'}>Voltar para {game.title}</Link></div>
    {uploads.map(([kind,title])=>{
      const image=publicImage(game[kind]);
      return <div className="panel" key={kind}><h2>{title}</h2><p className="muted">{kind==="cover_url"?"Recomendado: 1280 × 800 px (16:10). Aparece nos cards.":kind==="banner_url"?"Recomendado: 1920 × 1080 px (16:9). Fundo da página do jogo.":"Recomendado: 1920 × 1080 px. Imagens reais do gameplay."}</p>
        {editable && game.status==='draft' ? <GameImageUpload id={id} kind={kind} current={image}/> : image && <Image src={image} alt={title} width={224} height={126}/>}
      </div>;
    })}
    {editable && <div className="panel"><h2>Trailer e vídeo de fundo</h2>
      <p className="muted">Envie um vídeo MP4 ou WebM do seu dispositivo, ou cole um link. O primeiro vídeo MP4 ou WebM direto será usado no preview do card e como fundo cinematográfico da página do jogo; a capa será exibida enquanto o vídeo carrega.</p>
      <VideoUpload id={id}/><ActionForm action={editMedia.bind(null,id,'trailer')} label="Salvar vídeo"><Field name="url" label="Link HTTPS do vídeo (MP4 ou WebM para o fundo)" type="url" max={500} placeholder="https://estudio.com/gameplay.mp4" required/></ActionForm>
    </div>}
    {data.length>0 && <div className="panel"><h2>Mídias cadastradas</h2>{data.map(item=>{
      const image=publicImage(item.media_url);
      return <div key={item.id} className="row">
        {item.media_type==='screenshot'&&image ? <Image src={image} alt="Captura de tela" width={160} height={90}/> :
          item.media_type==='trailer'&&httpsUrl.safeParse(item.media_url).success ? <a className="text-link" href={item.media_url} target="_blank" rel="noopener noreferrer">{item.media_url.match(/\.(mp4|webm)(?:\?|$)/i)?'Vídeo de fundo · abrir arquivo':'Abrir trailer'}</a> : <p>Mídia indisponível</p>}
        {editable && <ActionForm action={removeMedia.bind(null,id,item.id)} label="Remover mídia" secondary/>}
      </div>;
    })}</div>}
    <Link className="button" href={'/developer/games/'+id+'/edit'}>Voltar para publicação</Link>
  </PortalShell>;
}
