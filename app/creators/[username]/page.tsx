import Image from 'next/image';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/supabase';
import { gameFields, publicImage, type Game } from '@/lib/catalog';
import { GameGrid } from '@/components/catalog-view';
import { UserRound } from 'lucide-react';
export default async function Page({params}:{params:Promise<{username:string}>}){
 const {username}=await params;
 const {client}=await requireSession('/creators/'+encodeURIComponent(username));
 const {data:p,error}=await client.from('profiles').select('id,username,bio,avatar_url,created_at').eq('username',username).eq('role','developer').maybeSingle();
 if(error)throw new Error('Perfil indisponível.');
 if(!p)notFound();
 const {data,count,error:gamesError}=await client.from('published_games_catalog').select(gameFields+',rating_average,review_count',{count:'exact'}).eq('developer_id',p.id).order('created_at',{ascending:false}).limit(100);
 const avatar=publicImage(p.avatar_url,'avatars');
 return <section className="container page creator-public"><header className="creator-profile-heading">{avatar?<Image width={96} height={96} src={avatar} alt="" className="creator-profile-avatar"/>:<span className="creator-profile-avatar"><UserRound size={42}/></span>}<div><p className="eyebrow">DESENVOLVEDOR</p><h1>{p.username}</h1><p className="muted">{count??0} jogos publicados · Membro desde {new Date(p.created_at).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</p></div></header><section className="page-section"><h2>Biografia</h2><p className="creator-bio">{p.bio||'Este criador ainda não adicionou uma biografia.'}</p></section><section className="page-section"><h2>Jogos publicados</h2>{gamesError?<p>Não foi possível carregar os jogos.</p>:data?.length?<GameGrid games={data as unknown as Game[]}/>:<p className="muted">Nenhum jogo publicado ainda.</p>}</section></section>;
}
