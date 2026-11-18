'use client';
import {useRef,useState,useEffect} from 'react';
import {Play,Pause} from 'lucide-react';
import {useGentleMotion} from './preferences-provider';

export function GameplayPreview({url}:{url:string}) {
 const video=useRef<HTMLVideoElement>(null);
 const [active,setActive]=useState(false);
 const [failed,setFailed]=useState(false);
 const reduced=useGentleMotion();
 useEffect(()=>{if(!active||!video.current)return;const el=video.current;void el.play().catch(()=>setActive(false));return()=>el.pause();},[active]);
 if(failed)return null;
 return <div className="gameplay-preview" onPointerEnter={e=>{if(e.pointerType==='mouse'&&!reduced)setActive(true)}} onPointerLeave={()=>setActive(false)}>
  {active&&<video ref={video} src={url} muted loop playsInline preload="none" onError={()=>{setFailed(true);setActive(false)}} aria-hidden="true"/>}
  <button type="button" className="preview-toggle" aria-label={active?'Pausar gameplay':'Reproduzir gameplay'} aria-pressed={active} onClick={()=>setActive(v=>!v)}>{active?<Pause size={16}/>:<Play size={16}/>}</button>
 </div>;
}
