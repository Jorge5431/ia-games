import {session} from '@/lib/supabase';
import {uuid} from '@/lib/rules';
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return new Response(null,{status:403});
 const current=await session();if(!current)return new Response(null,{status:401});
 let b;try{b=await req.json();}catch{return new Response(null,{status:400});}
 if(!b||!uuid.safeParse(b.id).success||!['start','heartbeat','end'].includes(b.event)||(b.session!==null&&!uuid.safeParse(b.session).success))return new Response(null,{status:400});
 const {data,error}=await current.client.rpc('telemetry_event',{p_game:b.id,p_event:b.event,p_session:b.session});
 return error?new Response(null,{status:400}):Response.json({session:data});
}
