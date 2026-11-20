'use client';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {editMedia} from '@/lib/portal-actions';
export function GameImageUpload({id,kind,current}:{id:string;kind:'cover_url'|'banner_url'|'screenshot';current:string|null}){
const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
const router=useRouter();
useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
function choose(next:File|null){setFile(next);setPreview(next?URL.createObjectURL(next):'');}
async function save(){if(!file||busy)return;setBusy(true);setMessage('Enviando...');try{const form=new FormData();form.set('image',file);const result=await editMedia(id,kind,{},form);if(result.error)throw Error(result.error);choose(null);setMessage(result.success==='Mídia salva.'?'Imagem salva!':result.success??'Imagem salva!');router.refresh();}catch(e){setMessage(e instanceof Error?e.message:'Falha no envio.');}finally{setBusy(false);}}
return <div className="stack"><div style={{aspectRatio:kind==='cover_url'?'16/10':'16/9',maxWidth:720,position:'relative',background:'var(--surface)',display:'grid',placeItems:'center',overflow:'hidden'}}>{preview||current?<Image fill unoptimized={Boolean(preview)} sizes="(max-width: 760px) 100vw, 720px" src={preview||current||''} alt="Prévia" style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<span>Selecione uma imagem</span>}</div><label className="field">Imagem do dispositivo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f&&f.size>4*1024*1024){setMessage('Limite de 4 MB.');choose(null);}else{choose(f??null);setMessage('');}}}/></label><small>JPEG, PNG ou WebP · até 4 MB</small><button type="button" className="button" disabled={!file||busy} onClick={()=>void save()}>{busy?'Enviando...':current?'Substituir imagem':'Salvar imagem'}</button><p role="status">{message}</p></div>;
}
