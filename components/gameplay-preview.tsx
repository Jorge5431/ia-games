'use client';
import {useRef,useState,useEffect} from 'react';
import {Play,Pause} from 'lucide-react';
import {useGentleMotion} from './preferences-provider';

export function GameplayPreview({url}:{url:string}) {
 const host=useRef<HTMLDivElement>(null);
 const video=useRef<HTMLVideoElement>(null);
 const [active,setActive]=useState(false);
 const [failed,setFailed]=useState(false);
 const reduced=useGentleMotion();
 useEffect(()=>{if(!active||!video.current)return;const el=video.current;void el.play().catch(()=>setActive(false));return()=>el.pause();},[active]);
 useEffect(()=>{const card=host.current?.parentElement;if(!card||reduced)return;const enter=(e:PointerEvent)=>{if(e.pointerType==='mouse')setActive(true)};const leave=()=>setActive(false);card.addEventListener('pointerenter',enter);card.addEventListener('pointerleave',leave);return()=>{card.removeEventListener('pointerenter',enter);card.removeEventListener('pointerleave',leave)};},[reduced,failed]);
 if(failed)return null;
 return <div className="gameplay-preview" ref={host} style={{pointerEvents:"none"}}>
  {active&&<video ref={video} src={url} muted loop playsInline preload="none" onError={()=>{setFailed(true);setActive(false)}} aria-hidden="true"/>}
  <button type="button" className="preview-toggle" style={{pointerEvents:"auto"}} aria-label={active?'Pausar gameplay':'Reproduzir gameplay'} aria-pressed={active} onClick={()=>setActive(v=>!v)}>{active?<Pause size={16}/>:<Play size={16}/>}</button>
 </div>;
}
