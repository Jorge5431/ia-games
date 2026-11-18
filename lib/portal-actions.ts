'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from './supabase';
import { categories, gameVideoUrl, platforms, slug, textField, uuid } from './rules';
import { uploadImage } from './upload-image';
import type { ActionState } from '@/components/action-form';

const gameInput=z.object({
  title:textField(100).min(2),slug,short_description:textField(240),description:textField(15000),
  price:z.string().trim().regex(/^\d{1,7}(\.\d{1,2})?$/).transform(Number),
  genre:z.string().refine(value=>categories.some(([,label])=>value===label)),
  languages:textField(200).transform(value=>value.split(',').map(item=>item.trim()).filter(Boolean)),
  release_date:z.union([z.iso.date(),z.literal('')]).transform(value=>value||null),
  minimum_requirements:textField(4000),recommended_requirements:textField(4000),ai_disclosure:textField(4000),
});

export async function saveGame(id:string|null,_previous:ActionState,form:FormData):Promise<ActionState> {
  if(id && !uuid.safeParse(id).success) return {error:'Jogo inválido.'};
  const {client,user}=await requireRole('developer',id?'/developer/games/'+id+'/edit':'/developer/games/new');
  const result=gameInput.safeParse(Object.fromEntries(form));
  const selected=z.array(z.enum(platforms)).max(platforms.length).safeParse(form.getAll('platform'));
  if(!result.success||!selected.success) return {error:'Confira o título, endereço do jogo, gênero, data e preço antes de salvar.'};
  const values={...result.data,platform:Array.from(new Set(selected.data))};
  const mutation=id
    ? client.from('games').update({...values,status:'draft'}).eq('id',id).eq('developer_id',user.id).in('status',['draft','rejected'])
    : client.from('games').insert({...values,developer_id:user.id});
  const {data,error}=await mutation.select('id').maybeSingle();
  if(error||!data) return {error:error?.code==='23505'?'Este endereço de jogo já existe. Escolha outro.':'Não foi possível salvar o rascunho.'};
  revalidatePath('/developer','layout');
  if(!id) redirect('/developer/games/'+data.id+'/edit');
  return {success:'Rascunho salvo.'};
}

export async function submitGame(id:string,_previous:ActionState,_form:FormData):Promise<ActionState> {
  void _form;
  if(!uuid.safeParse(id).success) return {error:'Jogo inválido.'};
  const {client}=await requireRole('developer','/developer/games/'+id+'/edit');
  const {error}=await client.rpc('submit_game',{p_game_id:id});
  if(error) return {error:'Preencha título, endereço, descrição e declaração de uso de IA antes de enviar.'};
  revalidatePath('/developer','layout');
  redirect('/developer/submissions');
}

export async function editMedia(gameId:string,kind:'cover_url'|'banner_url'|'screenshot'|'trailer',_previous:ActionState,form:FormData):Promise<ActionState> {
  if(!uuid.safeParse(gameId).success) return {error:'Jogo inválido.'};
  const path='/developer/games/'+gameId+'/media';
  const {client,user}=await requireRole('developer',path);
  const {data:game,error:gameError}=await client.from('games').select('id,status').eq('id',gameId).eq('developer_id',user.id).in('status',['draft','rejected']).maybeSingle();
  if(gameError||!game) return {error:'Este jogo não está disponível para edição.'};
  if(kind==='trailer'){
    const parsed=gameVideoUrl.safeParse(form.get('url'));
    if(!parsed.success) return {error:'Use um link de YouTube, Vimeo ou um arquivo MP4/WebM direto.'};
    const {error}=await client.from('game_media').insert({game_id:gameId,media_type:'trailer',media_url:parsed.data});
    if(error) return {error:'Não foi possível cadastrar o trailer.'};
  } else {
    if(game.status==='rejected' && kind!=='screenshot') return {error:'Salve o jogo como rascunho antes de alterar a capa ou o banner.'};
    const image=await uploadImage(client,'game-images',user.id,form.get('image'));
    if(!image.ok) return {error:image.error};
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
