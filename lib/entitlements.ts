import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { downloadState } from './rules';

export async function ownsGame(client: SupabaseClient, userId:string, gameId:string) {
  const {data,error}=await client.from('user_library').select('id').eq('user_id',userId).eq('game_id',gameId).maybeSingle();
  if(error) throw new Error('Não foi possível consultar sua biblioteca.');
  return Boolean(data);
}

export async function assessDownload(client:SupabaseClient,userId:string,gameId:string) {
  const [{data:game,error},owned]=await Promise.all([
    client.from('games').select('id,title,slug').eq('id',gameId).eq('status','published').maybeSingle(),
    ownsGame(client,userId,gameId),
  ]);
  if(error) throw new Error('Não foi possível verificar o jogo.');
  if(!game || !owned) return {state:downloadState(Boolean(game),owned),game,url:null};
  const {data:version,error:versionError}=await client.from('game_versions').select('id,security_status,object_path,created_at')
    .eq('game_id',gameId).in('security_status',['pending','approved']).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(1).maybeSingle();
  if(versionError) throw new Error('Não foi possível verificar a versão do jogo.');
  const state=downloadState(true,true,version?.security_status);
  if(state!=='authorize' || !version?.object_path) return {state,game,url:null};
  const {data,error:signedError}=await client.storage.from('game-builds').createSignedUrl(version.object_path,60,{download:true});
  if(signedError) throw new Error('Não foi possível autorizar o download.');
  return {state,game,url:data.signedUrl};
}
