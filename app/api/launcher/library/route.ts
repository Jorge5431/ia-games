import {createClient} from '@supabase/supabase-js';
import {supabaseConfig} from '@/lib/config';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:Request){
 const config=supabaseConfig();
 if(!config)return Response.json({error:'Serviço indisponível'},{status:503,headers});
 const token=req.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
 if(!token)return Response.json({error:'Autenticação necessária'},{status:401,headers});
 const client=createClient(config.url,config.key,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await client.auth.getUser(token);
 if(authError||!user)return Response.json({error:'Sessão inválida'},{status:401,headers});
 const {data,error}=await client.from('user_library').select('game_id,games!inner(id,title,slug,cover_url,status)').eq('user_id',user.id).eq('games.status','published');
 if(error)return Response.json({error:'Biblioteca indisponível'},{status:503,headers});
 return Response.json({version:1,games:data.map(entry=>({id:entry.game_id,game:entry.games}))},{headers});
}
