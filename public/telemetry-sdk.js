export function createTelemetry({client,gameId}) {
 let session=null,timer=null,busy=false;
 async function event(type){const {data,error}=await client.rpc('telemetry_event',{p_game:gameId,p_event:type,p_session:session});if(error)throw error;return data;}
 return {async start(){if(timer)return;session=await event('start');timer=setInterval(async()=>{if(busy)return;busy=true;try{await event('heartbeat');}catch{try{session=await event('start');}catch{}}finally{busy=false;}},30000);},async stop(){clearInterval(timer);timer=null;if(session){try{await event('end');}finally{session=null;}}}};
}
