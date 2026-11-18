import {requireSession} from '@/lib/supabase';
import {notFound} from 'next/navigation';
import {WebPlayer} from '@/components/web-player';
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const {client}=await requireSession('/play/'+id);
 const {data:g}=await client.from('published_games_catalog').select('id,title,price').eq('id',id).maybeSingle();
 if(!g||Number(g.price)!==0)notFound();
 const {data:d}=await client.from('game_delivery_intake').select('source_url').eq('game_id',id).eq('delivery_kind','web').is('package_path',null).maybeSingle();
 if(!d)notFound();let url:URL;try{url=new URL(d.source_url);}catch{notFound();}
 if(url.protocol!=='https:'||url.username||url.password)notFound();
 return <main className="container page"><h1>{g.title}</h1><WebPlayer id={id} url={url.href}/></main>;
}
