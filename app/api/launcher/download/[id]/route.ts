import {createClient} from '@supabase/supabase-js';
import {supabaseConfig} from '@/lib/config';
import {assessDownload} from '@/lib/entitlements';
import {uuid} from '@/lib/rules';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!uuid.safeParse(id).success)return Response.json({error:'Jogo inválido'},{status:400,headers});
 const config=supabaseConfig();
 if(!config)return Response.json({error:'Serviço indisponível'},{status:503,headers});
 const token=req.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
 if(!token)return Response.json({error:'Autenticação necessária'},{status:401,headers});
 const client=createClient(config.url,config.key,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await client.auth.getUser(token);
 if(error||!user)return Response.json({error:'Sessão inválida'},{status:401,headers});
 try{
 const result=await assessDownload(client,user.id,id);
 return Response.json({version:1,state:result.state,url:result.url},{status:result.state==='unavailable'?404:result.state==='acquire'?403:200,headers});
 }catch{return Response.json({error:'Download indisponível'},{status:503,headers});}
}
