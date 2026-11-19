import {requireSession} from '@/lib/supabase';
import {notFound,redirect} from 'next/navigation';
import {singleHtml} from '@/lib/single-html';
import {WebPlayer} from '@/components/web-player';
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const {client}=await requireSession('/play/'+id);
 const {data:g}=await client.from('published_games_catalog').select('id,title,price').eq('id',id).maybeSingle();
 if(!g||Number(g.price)!==0)notFound();
 const {data:d}=await client.from('game_delivery_intake').select('source_url,delivery_kind,package_path').eq('game_id',id).maybeSingle();
 if(!d)notFound();if(d.delivery_kind==='html_zip'&&d.package_path){const {data,error}=await client.storage.from('game-packages').download(d.package_path);if(error||!data) return <p>Arquivo indisponível.</p>;let html:string;try{html=singleHtml(new Uint8Array(await data.arrayBuffer()));}catch{return <p>Este pacote não é compatível com o player HTML único.</p>;}return <main style={{position:"fixed",inset:0,zIndex:100,background:"#090909",overflow:"auto"}}><WebPlayer id={id} html={html}/></main>;}if(d.delivery_kind!=='web')notFound();let url:URL;try{url=new URL(d.source_url);}catch{notFound();}
 if(url.protocol!=='https:'||url.username||url.password)notFound();
 redirect(url.href);
}
