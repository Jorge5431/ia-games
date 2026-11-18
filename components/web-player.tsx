'use client';
import {useEffect,useState} from 'react';
export function WebPlayer({id,url}:{id:string;url:string}){
 const [active,setActive]=useState(false);
 useEffect(()=>{if(!active)return;let sid:string|null=null,closed=false,busy=false;
 async function send(event:string){const r=await fetch('/api/telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,event,session:sid}),keepalive:event==='end'});if(r.ok){const d=await r.json();sid=d.session;return true;}return false;}
 async function tick(){if(closed||busy||document.hidden)return;busy=true;try{if(!await send(sid?'heartbeat':'start')&&!closed){sid=null;await send('start');}}catch{}finally{busy=false;if(closed&&sid)void send('end').catch(()=>{});}}
 void tick();const timer=setInterval(tick,30000);return()=>{closed=true;clearInterval(timer);if(sid&&!busy)void send('end').catch(()=>{});};
 },[active,id]);
 return <section className="panel"><p>Jogo externo em ambiente restrito. Não informe senhas ou dados pessoais. A atividade da sessão será registrada enquanto esta página estiver visível.</p>{active?<><button className="button secondary" onClick={()=>setActive(false)}>Encerrar sessão</button><iframe title="Jogo" src={url} sandbox="allow-scripts allow-pointer-lock" referrerPolicy="no-referrer" style={{width:'100%',height:'70vh',border:0}}/></>:<button className="button" onClick={()=>setActive(true)}>Jogar agora</button>}<p className="muted">Alguns jogos externos não permitem incorporação ou precisam de recursos bloqueados por segurança.</p></section>;
}
