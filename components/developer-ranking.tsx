import Link from 'next/link';
import { Trophy, ChevronRight } from 'lucide-react';
import { session } from '@/lib/supabase';
import { FallingText } from './falling-text';
export async function DeveloperRanking(){
 const current=await session();
 if(!current)return null;
 const {data,error}=await current.client.from('developer_leaderboard').select('username,game_count').order('game_count',{ascending:false}).order('username').limit(10);
 return <section className="page-section developer-ranking"><h2><Trophy size={24}/><FallingText text="Top desenvolvedores"/></h2><p className="muted">Criadores com mais jogos publicados na VORNELIX.</p>{error?<p>Ranking temporariamente indisponível.</p>:!data?.length?<p className="muted">Os primeiros criadores aparecerão aqui quando seus jogos forem publicados.</p>:<ol>{data.map((d,i)=><li key={d.username}><Link href={'/creators/'+encodeURIComponent(d.username)}><span className="rank-number">{String(i+1).padStart(2,'0')}</span><strong>{d.username}</strong><span className="rank-count">{d.game_count} jogos</span><ChevronRight size={18}/></Link></li>)}</ol>}</section>;
}
