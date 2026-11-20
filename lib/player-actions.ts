'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireSession } from './supabase';
import { httpsUrl, nextPath, textField, uuid } from './rules';
import { publishedGame } from './catalog';
import { uploadImage } from './upload-image';
import type { ActionState } from '@/components/action-form';

function fail(error: {code?:string} | null, message:string) {
  return error?.code === '23505' ? {error:'Já existe um registro com esses dados.'} : {error:message};
}

export async function updateProfile(_previous:ActionState,form:FormData):Promise<ActionState> {
  const {client,user}=await requireSession('/account/profile');
  const fields=z.object({
    username:z.string().trim().min(3).max(24).regex(/^[a-z0-9_]+$/),
    display_name:textField(60).min(2),bio:textField(500),
  }).safeParse(Object.fromEntries(form));
  if(!fields.success) return {error:'Confira o nome e o usuário. Use de 3 a 24 letras minúsculas, números ou _ no usuário.'};
  const {data,error}=await client.from('profiles').update(fields.data).eq('id',user.id).select('id').maybeSingle();
  if(error||!data) return fail(error,'Não foi possível atualizar o perfil.');
  revalidatePath('/account','layout');
  return {success:'Perfil salvo.'};
}

export async function changeAvatar(_previous:ActionState,form:FormData):Promise<ActionState> {
  const {client,user}=await requireSession('/account/profile');
  const uploaded=await uploadImage(client,'avatars',user.id,form.get('image'));
  if(!uploaded.ok) return {error:uploaded.error};
  const {data:previous}=await client.from('profiles').select('avatar_url').eq('id',user.id).maybeSingle();
  const {data,error}=await client.from('profiles').update({avatar_url:uploaded.url}).eq('id',user.id).select('id').maybeSingle();
  if(error||!data) {
    await client.storage.from('avatars').remove([uploaded.path]);
    return fail(error,'Não foi possível salvar o novo avatar.');
  }
  const prefix=uploaded.url.slice(0,-uploaded.path.length);
  if(typeof previous?.avatar_url==='string'&&previous.avatar_url.startsWith(prefix+user.id+'/')){
    await client.storage.from('avatars').remove([previous.avatar_url.slice(prefix.length)]);
  }
  revalidatePath('/account','layout');
  return {success:'Avatar atualizado.'};
}

export async function claimGame(gameId:string,_previous:ActionState,_form:FormData):Promise<ActionState> {
  void _form;
  if(!uuid.safeParse(gameId).success) return {error:'Jogo inválido.'};
  const {client}=await requireSession('/checkout/'+gameId);
  const {error}=await client.rpc('claim_free_game',{p_game_id:gameId});
  if(error) return fail(error,'Este jogo gratuito está indisponível.');
  revalidatePath('/library');
  redirect('/library');
}

export async function updateWishlist(gameId:string,add:boolean,path:string,_previous:ActionState,_form:FormData):Promise<ActionState> {
  void _form;
  if(!uuid.safeParse(gameId).success) return {error:'Jogo inválido.'};
  const safe=nextPath(path,'/wishlist');
  const {client,user}=await requireSession(safe);
  if(add && !(await publishedGame('id',gameId))) return {error:'Este jogo está indisponível.'};
  const {error}=add
    ? await client.from('wishlists').upsert({user_id:user.id,game_id:gameId},{onConflict:'user_id,game_id',ignoreDuplicates:true})
    : await client.from('wishlists').delete().eq('user_id',user.id).eq('game_id',gameId);
  if(error) return fail(error,'Não foi possível atualizar os favoritos.');
  revalidatePath(safe);
  revalidatePath('/wishlist');
  return {success:add?'Jogo adicionado à lista.':'Jogo removido da lista.'};
}

export async function saveReview(gameId:string,existing:string|null,path:string,_previous:ActionState,form:FormData):Promise<ActionState> {
  if(!uuid.safeParse(gameId).success || (existing && !uuid.safeParse(existing).success)) return {error:'Avaliação inválida.'};
  const safe=nextPath(path,'/account/reviews');
  const {client,user}=await requireSession(safe);
  const parsed=z.object({rating:z.coerce.number().int().min(1).max(5),comment:textField(2000)}).safeParse(Object.fromEntries(form));
  if(!parsed.success) return {error:'Escolha uma nota entre 1 e 5 e revise o tamanho do comentário.'};
  const {data:owned,error:ownedError}=await client.from('user_library').select('id').eq('user_id',user.id).eq('game_id',gameId).maybeSingle();
  if(ownedError||!owned||!(await publishedGame('id',gameId))) return {error:'Você precisa ter esse jogo publicado na biblioteca para avaliá-lo.'};
  const result=existing
    ? await client.from('reviews').update(parsed.data).eq('id',existing).eq('user_id',user.id).eq('game_id',gameId).select('id').maybeSingle()
    : await client.from('reviews').insert({...parsed.data,user_id:user.id,game_id:gameId}).select('id').single();
  if(result.error||!result.data) return fail(result.error,'Não foi possível salvar a avaliação.');
  revalidatePath(safe);
  revalidatePath('/account/reviews');
  return {success:'Avaliação salva.'};
}

export async function deleteReview(id:string,path:string,_previous:ActionState,_form:FormData):Promise<ActionState> {
  void _form;
  if(!uuid.safeParse(id).success) return {error:'Avaliação inválida.'};
  const safe=nextPath(path,'/account/reviews');
  const {client,user}=await requireSession(safe);
  const {data,error}=await client.from('reviews').delete().eq('id',id).eq('user_id',user.id).select('id').maybeSingle();
  if(error||!data) return fail(error,'Não foi possível excluir a avaliação.');
  revalidatePath(safe);
  revalidatePath('/account/reviews');
  return {success:'Avaliação excluída.'};
}

export async function applyDeveloper(_previous:ActionState,form:FormData):Promise<ActionState> {
  const {client,user}=await requireSession('/developer/apply');
  const input=z.object({studio_name:textField(80).min(2),description:textField(2000).min(10),portfolio_url:z.union([httpsUrl.max(500),z.literal('')])}).safeParse(Object.fromEntries(form));
  if(!input.success) return {error:'Informe o estúdio, uma descrição e um endereço HTTPS válido, se houver.'};
  const {error}=await client.from('developer_applications').insert({...input.data,portfolio_url:input.data.portfolio_url||null,user_id:user.id});
  if(error) return fail(error,'Não foi possível enviar a solicitação.');
  revalidatePath('/developer/apply');
  return {success:'Solicitação enviada para análise.'};
}
