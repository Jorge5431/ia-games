import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

const mimeTypes = {'image/png':'png','image/jpeg':'jpg','image/webp':'webp'} as const;
type Mime = keyof typeof mimeTypes;

function matchesMime(data: Uint8Array, mime: Mime) {
  if(mime==='image/png') return [137,80,78,71,13,10,26,10].every((byte,index)=>data[index]===byte);
  if(mime==='image/jpeg') return data[0]===255 && data[1]===216 && data[2]===255;
  const header=new TextDecoder().decode(data);
  return header.startsWith('RIFF') && header.slice(8,12)==='WEBP';
}

export async function uploadImage(client:SupabaseClient,bucket:'avatars'|'game-images',userId:string,value:FormDataEntryValue|null) {
  const limit=bucket==='avatars'?5:10;
  if(!(value instanceof File) || value.size<16 || value.size>limit*1024*1024 || !Object.hasOwn(mimeTypes,value.type)){
    return {ok:false,error:'Selecione uma imagem JPEG, PNG ou WebP de até '+limit+' MB.'} as const;
  }
  const mime=value.type as Mime;
  if(!matchesMime(new Uint8Array(await value.slice(0,12).arrayBuffer()),mime)) return {ok:false,error:'O conteúdo do arquivo não corresponde ao formato informado.'} as const;
  const path=userId+'/'+crypto.randomUUID()+'.'+mimeTypes[mime];
  const {error}=await client.storage.from(bucket).upload(path,value,{contentType:mime,cacheControl:'3600',upsert:false});
  if(error) return {ok:false,error:'Não foi possível enviar a imagem.'} as const;
  return {ok:true,path,url:client.storage.from(bucket).getPublicUrl(path).data.publicUrl} as const;
}
