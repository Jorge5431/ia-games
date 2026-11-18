'use client';
import {useEffect,useState,useRef} from 'react';
export function WebPlayer({id,url,html}:{id:string;url?:string;html?:string}){
 const [active,setActive]=useState(true);const [notice,setNotice]=useState('');const player=useRef<HTMLElement>(null);
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await player.current?.requestFullscreen();}catch{setNotice('Tela cheia indisponível neste navegador.');}}
 useEffect(()=>{if(!active)return;let sid:string|null=null,closed=false,busy=false;
 async function send(event:string){const r=await fetch('/api/telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,event,session:sid}),keepalive:event==='end'});if(r.ok){const d=await r.json();sid=d.session;return true;}return false;}
 async function tick(){if(closed||busy||document.hidden)return;busy=true;try{if(!await send(sid?'heartbeat':'start')&&!closed){sid=null;await send('start');}}catch{}finally{busy=false;if(closed&&sid)void send('end').catch(()=>{});}}
 void tick();const timer=setInterval(tick,30000);return()=>{closed=true;clearInterval(timer);if(sid&&!busy)void send('end').catch(()=>{});};
 },[active,id]);
 return <section ref={player} className="web-game-player"><div className="web-game-toolbar"><span>VORNELIX · Jogo em navegador</span><button className="button secondary" onClick={()=>void fullscreen()}>Tela cheia</button><button className="button secondary" onClick={()=>setActive(!active)}>{active?'Encerrar sessão':'Jogar agora'}</button></div>{notice&&<p role="status">{notice}</p>}{active?<iframe title="Jogo" src={html?undefined:url} srcDoc={html} sandbox="allow-scripts allow-pointer-lock" allow="fullscreen" referrerPolicy="no-referrer"/>:<p>Sessão encerrada.</p>}<small>Ambiente restrito. Não informe senhas. Alguns jogos externos bloqueiam incorporação.</small></section>;
}
