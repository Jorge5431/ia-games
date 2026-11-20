import 'server-only';

import { notFound } from 'next/navigation';
import { gameDetailsFields, gameFields, type Game } from './catalog';
import { requireRole } from './supabase';
import { uuid } from './rules';

export async function ownerGame(id:string,view:'edit'|'media') {
  if(!uuid.safeParse(id).success) notFound();
  const {client,user}=await requireRole('developer','/developer/games/'+id+'/'+view);
  const {data,error}=await client.from('games').select(gameDetailsFields).eq('id',id).eq('developer_id',user.id).maybeSingle();
  if(error) throw new Error('Não foi possível consultar este jogo.');
  if(!data) notFound();
  return {client,user,game:data as unknown as Game};
}

export async function developerGames(path:string) {
  const {client,user}=await requireRole('developer',path);
  const {data,error}=await client.from('games').select(gameFields).eq('developer_id',user.id).order('updated_at',{ascending:false});
  if(error) throw new Error('Não foi possível consultar seus jogos.');
  return {client,user,games:data as unknown as Game[]};
}

export async function administrativeStats(path:string) {
  const {client}=await requireRole('admin',path);
  const queries=[
    ['Usuários',client.from('profiles').select('id',{head:true,count:'exact'})],
    ['Desenvolvedores',client.from('profiles').select('id',{head:true,count:'exact'}).eq('role','developer')],
    ['Solicitações pendentes',client.from('developer_applications').select('id',{head:true,count:'exact'}).eq('status','pending')],
    ['Jogos cadastrados',client.from('games').select('id',{head:true,count:'exact'})],
    ['Jogos em análise',client.from('games').select('id',{head:true,count:'exact'}).eq('status','pending')],
    ['Jogos publicados',client.from('games').select('id',{head:true,count:'exact'}).eq('status','published')],
    ['Jogos rejeitados',client.from('games').select('id',{head:true,count:'exact'}).eq('status','rejected')],
  ] as const;
  const counts=await Promise.all(queries.map(async([label,query])=>{
    const {count,error}=await query;
    if(error) throw new Error('Não foi possível consultar as métricas.');
    return [label,count ?? 0] as const;
  }));
  return {client,counts};
}
