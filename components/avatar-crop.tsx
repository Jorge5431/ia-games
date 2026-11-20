'use client';
import {useRef,useState} from 'react';
import {changeAvatar} from '@/lib/player-actions';
import {imageInputAccept,imageLimitBytes} from '@/lib/image-limits';

export function AvatarCrop(){
 const image=useRef<HTMLImageElement|null>(null);
 const generation=useRef(0);
 const [preview,setPreview]=useState('');
 const [dimensions,setDimensions]=useState({w:1,h:1});
 const [zoom,setZoom]=useState(1);
 const [x,setX]=useState(0);
 const [y,setY]=useState(0);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const size=256;
 const scale=Math.max(size/dimensions.w,size/dimensions.h)*zoom;
 const w=dimensions.w*scale,h=dimensions.h*scale;
 const left=(size-w)/2+x*(w-size)/2,top=(size-h)/2+y*(h-size)/2;
 async function choose(file:File|undefined){
  const id=++generation.current;setError('');setSuccess('');setPreview('');image.current=null;
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>imageLimitBytes){setError('Escolha uma imagem JPEG, PNG ou WebP dentro do limite permitido.');return;}
  const url=URL.createObjectURL(file);
  try{
   const img=new window.Image();img.src=url;await img.decode();
   if(id!==generation.current)return;
   if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth*img.naturalHeight>40000000)throw new Error('Imagem inválida ou muito grande.');
   const canvas=document.createElement('canvas');const factor=Math.min(1,2048/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));
   const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Não foi possível abrir a imagem.');
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const src=canvas.toDataURL('image/webp',.92);const normalized=new window.Image();normalized.src=src;await normalized.decode();
   if(id!==generation.current)return;
   image.current=normalized;setDimensions({w:normalized.naturalWidth,h:normalized.naturalHeight});setZoom(1);setX(0);setY(0);setPreview(src);
  }catch{if(id===generation.current)setError('Não foi possível abrir a imagem.');}finally{URL.revokeObjectURL(url);}
 }
 async function save(){
  if(!image.current||busy)return;
  setBusy(true);setError('');setSuccess('');
  try{
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Recorte indisponível.');
   ctx.drawImage(image.current,left*2,top*2,w*2,h*2);
   const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.92));if(!blob)throw new Error('Não foi possível gerar o avatar.');
   const form=new FormData();form.set('image',new File([blob],'avatar.webp',{type:blob.type}));
   const result=await changeAvatar({},form);if(result.error)setError(result.error);else{setSuccess(result.success??'Avatar atualizado.');setPreview('');image.current=null;}
  }catch{setError('Não foi possível salvar o avatar.');}finally{setBusy(false);}
 }
 return <div className="avatar-crop"><label className="field">Escolher foto<input type="file" accept={imageInputAccept} disabled={busy} onChange={e=>void choose(e.currentTarget.files?.[0])}/></label>
 {preview&&<><p className="muted">Ajuste a foto dentro do círculo. Apenas esta área aparecerá no perfil.</p><div className="avatar-crop-frame" style={{backgroundImage:'url('+preview+')',backgroundSize:w+'px '+h+'px',backgroundPosition:left+'px '+top+'px'}} role="img" aria-label="Prévia circular do avatar"/>
 <label className="field">Zoom<input type="range" min={1} max={3} step={.01} value={zoom} disabled={busy} onChange={e=>setZoom(Number(e.target.value))}/></label>
 <label className="field">Posição horizontal<input type="range" min={-1} max={1} step={.01} value={x} disabled={busy} onChange={e=>setX(Number(e.target.value))}/></label>
 <label className="field">Posição vertical<input type="range" min={-1} max={1} step={.01} value={y} disabled={busy} onChange={e=>setY(Number(e.target.value))}/></label>
 <div className="toolbar"><button className="button" type="button" disabled={busy} onClick={()=>void save()}>{busy?'Salvando…':'Confirmar recorte e salvar'}</button><button className="button secondary" type="button" disabled={busy} onClick={()=>{setPreview('');image.current=null;}}>Cancelar</button></div></>}
 {error&&<p role="alert" className="feedback error">{error}</p>}{success&&<p role="status" className="feedback success">{success}</p>}</div>;
}
