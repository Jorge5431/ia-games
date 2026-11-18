'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {useRouter} from 'next/navigation';
import {registerVideo} from '@/lib/portal-actions';
export function VideoUpload({id}:{id:string}){
 const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const router=useRouter();
 async function upload(){if(!file||busy)return;setBusy(true);setMessage('Enviando vídeo...');
 try{const ext=file.type==='video/mp4'?'mp4':file.type==='video/webm'?'webm':null;if(!ext||file.size>50*1024*1024)throw Error('Selecione MP4 ou WebM de até 50 MB.');
 const client=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
 const {data:{user}}=await client.auth.getUser();if(!user)throw Error('Entre novamente na sua conta.');
 const path=user.id+'/'+id+'/'+crypto.randomUUID()+'.'+ext;
 const {error}=await client.storage.from('game-videos').upload(path,file,{contentType:file.type,upsert:false});if(error)throw Error(error.message);
 const result=await registerVideo(id,path);if(result.error)throw Error(result.error);setMessage('Vídeo salvo.');setFile(null);router.refresh();
 }catch(e){setMessage(e instanceof Error?e.message:'Falha no envio.');}finally{setBusy(false);}}
 return <div className="stack"><label className="field">Vídeo do dispositivo<input type="file" accept="video/mp4,video/webm" onChange={e=>setFile(e.target.files?.[0]??null)}/></label><button type="button" className="button" disabled={!file||busy} onClick={()=>void upload()}>{busy?'Enviando...':'Enviar vídeo'}</button><small>MP4 ou WebM · até 50 MB</small><p role="status">{message}</p></div>;
}
