'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from './supabase';
import { categories, gameVideoUrl, textField, uuid } from './rules';
import { inspectZip } from './zip-inspect';
import { uploadImage } from './upload-image';
import type { ActionState } from '@/components/action-form';

const gameInput=z.object({title:textField(100).min(2),description:textField(15000).min(1),genre:z.string().refine(value=>categories.some(([,label])=>value===label))});

export async function saveGame(id:string|null,_previous:ActionState,form:FormData):Promise<ActionState> {
  if(id && !uuid.safeParse(id).success) return {error:'Jogo inválido.'};
  const {client,user}=await requireRole('developer',id?'/developer/games/'+id+'/edit':'/developer/games/new');
  const result=gameInput.safeParse(Object.fromEntries(form));
  if(!result.success)return {error:'Preencha título, gênero e descrição.'};
  const base=result.data.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,75).replace(/-$/,'')||'jogo';
  const values={...result.data,short_description:result.data.description.slice(0,240),price:0};
  const mutation=id
    ? client.from('games').update({...values,status:'draft'}).eq('id',id).eq('developer_id',user.id).in('status',['draft','rejected'])
    : client.from('games').insert({...values,slug:base+'-'+crypto.randomUUID().slice(0,12),developer_id:user.id});
  const {data,error}=await mutation.select('id').maybeSingle();
  if(error||!data) return {error:error?.code==='23505'?'Este endereço de jogo já existe. Escolha outro.':'Não foi possível salvar o rascunho.'};
  revalidatePath('/developer','layout');
  if(!id) redirect('/developer/games/'+data.id+'/edit');
  if(form.get('intent')==='submit') return submitGame(id,_previous,form);
  return {success:'Rascunho salvo.'};
}

export async function submitGame(id:string,_previous:ActionState,_form:FormData):Promise<ActionState> {
  void _form;
  if(!uuid.safeParse(id).success) return {error:'Jogo inválido.'};
  const {client}=await requireRole('developer','/developer/games/'+id+'/edit');
  const {error}=await client.rpc('submit_game',{p_game_id:id});
  if(error) { console.error('submit_game',error.code,error.message); return {error:error.message.startsWith('Jogo incompleto')?'Preencha título, gênero, descrição e envie o arquivo ou link.':'Não foi possível publicar. Código: '+error.code}; }
  revalidatePath('/developer','layout');
  revalidatePath('/','layout');
  const {data:published}=await client.from('games').select('status,slug').eq('id',id).maybeSingle();
  if(published?.status==='published') redirect('/game/'+encodeURIComponent(published.slug));
  redirect('/developer/submissions');
}

async function queueMedia(client:Awaited<ReturnType<typeof requireRole>>['client'],id:string,kind:'cover_url'|'banner_url'|'trailer'|'screenshot',url:string){
 const {data:g}=await client.from('games').select('title,description,developer_id').eq('id',id).single();
 if(!g)return {error:'Jogo indisponível.'};
 const {data:u,error}=await client.from('game_updates').insert({game_id:id,title:g.title,description:g.description,notes:'Alteração de mídia: '+kind,media_kind:kind,media_url:url}).select('id').single();
 if(error||!u)return {error:'Não foi possível solicitar alteração. Confira atualizações pendentes.'};
 if(g.developer_id==='d85bf8a9-8e6c-469a-99cb-3ebbeec6b4cb'){const {error:e}=await client.rpc('review_update',{p_id:u.id,p_approve:true});if(e)return {error:'Alteração enviada, mas aprovação automática falhou.'};}
 revalidatePath('/','layout');return {success:g.developer_id==='d85bf8a9-8e6c-469a-99cb-3ebbeec6b4cb'?'Mídia publicada.':'Mídia enviada para análise.'};
}
export async function editMedia(gameId:string,kind:'cover_url'|'banner_url'|'screenshot'|'trailer',_previous:ActionState,form:FormData):Promise<ActionState> {
  if(!uuid.safeParse(gameId).success) return {error:'Jogo inválido.'};
  const path='/developer/games/'+gameId+'/media';
  const {client,user}=await requireRole('developer',path);
  const {data:game,error:gameError}=await client.from('games').select('id,status').eq('id',gameId).eq('developer_id',user.id).in('status',['draft','rejected','published']).maybeSingle();
  if(gameError||!game) return {error:'Este jogo não está disponível para edição.'};
  if(kind==='trailer'){
    const parsed=gameVideoUrl.safeParse(form.get('url'));
    if(!parsed.success) return {error:'Use um link de YouTube, Vimeo ou um arquivo MP4/WebM direto.'};
    if(game.status==='published')return queueMedia(client,gameId,'trailer',parsed.data);
    const {error}=await client.from('game_media').insert({game_id:gameId,media_type:'trailer',media_url:parsed.data});
    if(error) return {error:'Não foi possível cadastrar o trailer.'};
  } else {
    if(game.status==='rejected' && kind!=='screenshot') return {error:'Salve o jogo como rascunho antes de alterar a capa ou o banner.'};
    const image=await uploadImage(client,'game-images',user.id,form.get('image'));
    if(!image.ok) return {error:image.error};
    if(game.status==='published')return queueMedia(client,gameId,kind,image.url);
    const result=kind==='screenshot'
      ? await client.from('game_media').insert({game_id:gameId,media_type:'screenshot',media_url:image.url}).select('id').maybeSingle()
      : await client.from('games').update({[kind]:image.url}).eq('id',gameId).eq('developer_id',user.id).eq('status','draft').select('id').maybeSingle();
    if(result.error||!result.data) return {error:'O arquivo foi enviado, mas não pôde ser associado ao jogo.'};
  }
  revalidatePath(path);
  return {success:'Mídia salva.'};
}

export async function removeMedia(gameId:string,id:string,_previous:ActionState,_form:FormData):Promise<ActionState> {
  void _form;
  if(!uuid.safeParse(gameId).success||!uuid.safeParse(id).success) return {error:'Mídia inválida.'};
  const path='/developer/games/'+gameId+'/media';
  const {client}=await requireRole('developer',path);
  const {data,error}=await client.from('game_media').delete().eq('id',id).eq('game_id',gameId).select('id').maybeSingle();
  if(error||!data) return {error:'Não foi possível remover a mídia.'};
  revalidatePath(path);
  return {success:'Mídia removida.'};
}

export async function reviewDeveloper(id:string,approved:boolean,_previous:ActionState,_form:FormData):Promise<ActionState> {
  void _form;
  if(!uuid.safeParse(id).success) return {error:'Solicitação inválida.'};
  const {client}=await requireRole('admin','/admin/developers');
  const {error}=await client.rpc('review_developer_application',{p_application_id:id,p_approved:approved});
  if(error) return {error:'Não foi possível registrar a decisão. Confira se a solicitação continua pendente.'};
  revalidatePath('/admin','layout');
  return {success:approved?'Solicitação aprovada.':'Solicitação rejeitada.'};
}

export async function moderateGame(id:string,_previous:ActionState,form:FormData):Promise<ActionState> {
  if(!uuid.safeParse(id).success) return {error:'Jogo inválido.'};
  const {client}=await requireRole('admin','/admin/moderation');
  const fields=z.object({decision:z.enum(['approve','reject']),notes:textField(2000)}).safeParse(Object.fromEntries(form));
  if(!fields.success) return {error:'Escolha uma decisão e revise a nota.'};
  if(fields.data.decision==='reject' && !fields.data.notes) return {error:'Informe o motivo da rejeição.'};
  const {error}=await client.rpc('review_game',{p_game_id:id,p_approved:fields.data.decision==='approve',p_notes:fields.data.notes||null});
  if(error) return {error:'Não foi possível concluir a análise. Confira se o jogo continua pendente.'};
  revalidatePath('/admin','layout');
  revalidatePath('/','layout');
  return {success:'Decisão registrada.'};
}

export async function saveDelivery(id:string,_previous:ActionState,form:FormData):Promise<ActionState>{
 if(!uuid.safeParse(id).success)return {error:'Jogo inválido.'};
 const {client}=await requireRole('developer','/developer/games/'+id+'/edit');
 const parsed=z.object({delivery_kind:z.enum(['web','html_zip','windows_zip']),source_url:z.string().max(1000).url().refine(v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}})}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Informe um link HTTPS válido.'};
 const {error}=await client.from('game_delivery_intake').upsert({game_id:id,...parsed.data,package_path:null,entry_hint:null,updated_at:new Date().toISOString()});
 if(error){console.error('saveDelivery',error.code,error.message);return {error:'Não foi possível salvar o link do jogo. Código: '+error.code};}
 revalidatePath('/developer/games/'+id+'/edit');redirect('/developer/games/'+id+'/edit');
}

export async function uploadPackage(id:string,_previous:ActionState,form:FormData):Promise<ActionState>{
 if(!uuid.safeParse(id).success)return {error:'Jogo inválido.'};
 const {client,user}=await requireRole('developer','/developer/games/'+id+'/edit');
 const file=form.get('package');if(!(file instanceof File)||!file.name.toLowerCase().endsWith('.zip')||file.size>2097152)return {error:'Selecione um ZIP de até 2 MB.'};
 const {data:game}=await client.from('games').select('id').eq('id',id).eq('developer_id',user.id).in('status',['draft','rejected']).maybeSingle();
 if(!game)return {error:'Jogo indisponível para edição.'};
 let info;try{info=inspectZip(new Uint8Array(await file.arrayBuffer()));}catch{return {error:'ZIP inválido ou estrutura não permitida.'};}
 const path=user.id+'/'+id+'/'+crypto.randomUUID()+'.zip';
 const {error}=await client.storage.from('game-packages').upload(path,file,{contentType:'application/zip',upsert:false});
 if(error)return {error:'Falha no envio do arquivo.'};
 const result=await client.from('game_delivery_intake').upsert({game_id:id,delivery_kind:info.kind,source_url:'https://vornelix-games.vercel.app/private-package',package_path:path,entry_hint:info.entry||null,updated_at:new Date().toISOString()});
 if(result.error)return {error:'Arquivo armazenado, mas associação falhou.'};
 revalidatePath('/developer/games/'+id+'/edit');return {success:'ZIP recebido. Aguardando análise de segurança.'};
}

export async function registerVideo(id:string,path:string):Promise<ActionState>{
 if(!uuid.safeParse(id).success)return {error:'Jogo inválido.'};
 const {client,user}=await requireRole('developer','/developer/games/'+id+'/media');
 if(!path.startsWith(user.id+'/'+id+'/')||!/^[-a-f0-9]+\.(mp4|webm)$/.test(path.split('/').at(-1)??'')||path.split('/').length!==3)return {error:'Arquivo inválido.'};
 const {data:game}=await client.from('games').select('id,status').eq('id',id).eq('developer_id',user.id).in('status',['draft','rejected','published']).maybeSingle();if(!game)return {error:'Jogo indisponível.'};
 const {data}=client.storage.from('game-videos').getPublicUrl(path);
 if(game.status==='published')return queueMedia(client,id,'trailer',data.publicUrl);
 const {error}=await client.from('game_media').insert({game_id:id,media_type:'trailer',media_url:data.publicUrl});
 if(error)return {error:'Não foi possível associar o vídeo.'};
 revalidatePath('/developer/games/'+id+'/media');return {success:'Vídeo salvo.'};
}

export async function requestUpdate(id:string,_previous:ActionState,form:FormData):Promise<ActionState>{
 if(!uuid.safeParse(id).success)return {error:'Jogo inválido.'};
 const {client,user}=await requireRole('developer','/developer/games/'+id+'/edit');
 const parsed=z.object({genre:gameInput.shape.genre,title:textField(100).min(2),description:textField(15000).min(1),notes:textField(2000).min(1)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Preencha todos os campos.'};
 const {data:game}=await client.from('games').select('id').eq('id',id).eq('developer_id',user.id).eq('status','published').maybeSingle();
 if(!game)return {error:'Jogo indisponível.'};
 const file=form.get('package');let delivery={};
 if(file instanceof File&&file.size){if(file.size>2097152||!file.name.toLowerCase().endsWith('.zip'))return {error:'ZIP de até 2 MB.'};let info;try{info=inspectZip(new Uint8Array(await file.arrayBuffer()));}catch{return {error:'ZIP inválido.'};}
 const path=user.id+'/'+id+'/'+crypto.randomUUID()+'.zip';const uploaded=await client.storage.from('game-packages').upload(path,file,{contentType:'application/zip',upsert:false});if(uploaded.error)return {error:'Falha no upload.'};delivery={package_path:path,delivery_kind:info.kind,entry_hint:info.entry||null};}
 const {error}=await client.from('game_updates').insert({game_id:id,...parsed.data,...delivery});
 if(error)return {error:'Não foi possível enviar. Confira se já existe uma atualização pendente.'};
 revalidatePath('/developer/games/'+id+'/edit');return {success:'Atualização enviada. A versão publicada permanece disponível.'};
}
export async function reviewUpdate(id:string,approve:boolean,_previous:ActionState,_form:FormData):Promise<ActionState>{
 if(!uuid.safeParse(id).success)return {error:'Atualização inválida.'};
 const {client}=await requireRole('admin','/admin/moderation');
 const {error}=await client.rpc('review_update',{p_id:id,p_approve:approve});
 if(error)return {error:'Não foi possível concluir a análise.'};
 revalidatePath('/','layout');return {success:'Decisão registrada.'};
}

export async function unpublishGame(id:string,_previous:ActionState,form:FormData):Promise<ActionState>{
 if(!uuid.safeParse(id).success||form.get('confirm')!=='yes')return {error:'Confirme a remoção.'};
 const {client}=await requireRole('developer','/developer/games');
 const {error}=await client.rpc('unpublish_game',{p_id:id});
 if(error)return {error:'Não foi possível remover o jogo. Verifique suas permissões.'};
 revalidatePath('/','layout');return {success:'Jogo removido do catálogo.'};
}

export async function deleteOwnGame(id:string,_previous:ActionState,form:FormData):Promise<ActionState>{
 if(!uuid.safeParse(id).success||form.get('confirm')!=='yes')return {error:'Confirme a exclusão definitiva.'};
 const {client,user}=await requireRole('developer','/developer/games');
 const {data:game,error:lookupError}=await client.from('games').select('id,status').eq('id',id).eq('developer_id',user.id).maybeSingle();
 if(lookupError||!game)return {error:'Jogo não encontrado ou sem permissão.'};
 if(!['draft','rejected'].includes(game.status))return {error:'Somente rascunhos e jogos rejeitados podem ser excluídos definitivamente.'};
 const {error}=await client.rpc('delete_own_game',{p_id:id});
 if(error)return {error:'Não foi possível excluir. O jogo pode possuir instalações, histórico ou vínculos pendentes.'};
 revalidatePath('/developer/games');revalidatePath('/','layout');
 return {success:'Jogo excluído definitivamente.'};
}
