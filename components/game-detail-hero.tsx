'use client';
import { FallingText } from '@/components/falling-text';

import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowLeft, Gamepad2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { usePreferences } from './preferences-provider';

type Props={
  title:string;
  genre:string|null;
  description:string|null;
  cover:string|null;
  poster:string|null;
  gameplay:string|null;
  heroMedia?:'banner'|'trailer';
  rating:string;
  platforms:string[];
  purchase:ReactNode;
};

export function GameDetailHero({title,genre,description,cover,poster,gameplay,heroMedia='trailer',rating,platforms,purchase}:Props) {
  const videoRef=useRef<HTMLVideoElement>(null);
  const {preferences}=usePreferences();
  const reduced=preferences.motion==='reduced';
  const [playback,setPlayback]=useState<'automatic'|'playing'|'paused'>('automatic');
  const [paused,setPaused]=useState(true);
  const [muted,setMuted]=useState(true);
  const [videoVisible,setVideoVisible]=useState(false);
  const [videoUnavailable,setVideoUnavailable]=useState(false);
  const showVideo=heroMedia==='trailer'&&Boolean(gameplay)&&!videoUnavailable;

  useEffect(()=>{
    const video=videoRef.current;
    if(!video||!showVideo) return;
    video.muted=muted;
    if(playback==='paused') {
      video.pause();
      return;
    }
    void video.play().catch(()=>setVideoVisible(false));
  },[muted,playback,showVideo,gameplay]);

  return <section className="detail-cinematic" aria-label={'Detalhes de '+title}>
    {poster && (!showVideo||!videoVisible) && <Image className="detail-poster" src={poster} fill sizes="100vw" alt="" priority/>}
    {showVideo&&<video ref={videoRef} className={'detail-gameplay'+(videoVisible?' is-visible':'')} src={gameplay ?? undefined} muted autoPlay loop playsInline preload="auto" aria-hidden="true" onCanPlay={event=>{if(playback!=='paused')void event.currentTarget.play().catch(()=>setVideoVisible(false))}} onPlaying={()=>{setVideoVisible(true);setPaused(false)}} onPlay={()=>setPaused(false)} onPause={()=>setPaused(true)} onError={()=>{setVideoUnavailable(true);setVideoVisible(false)}}/>}
    <div className="detail-cinematic-shade" aria-hidden="true"/>
    <div className="detail-hero-top">
      <Link className="button secondary detail-back" href="/store"><ArrowLeft size={17}/>Voltar à loja</Link>
      {showVideo&&<div className="detail-video-controls" aria-label="Controles do vídeo de fundo">
        <button className="icon-button" type="button" aria-label={paused?'Reproduzir vídeo de fundo':'Pausar vídeo de fundo'} aria-pressed={!paused} onClick={()=>setPlayback(videoRef.current?.paused?'playing':'paused')}>{paused?<Play size={18}/>:<Pause size={18}/>}</button>
        <button className="icon-button" type="button" aria-label={muted?'Ativar áudio do vídeo':'Silenciar áudio do vídeo'} aria-pressed={!muted} onClick={()=>setMuted(value=>!value)}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button>
      </div>}
    </div>
    <div className="detail-hero-inner">
      <motion.div className="detail-cover" initial={reduced?false:{opacity:0,y:18}} animate={{opacity:1,y:0}} whileHover={reduced?undefined:{y:-7,rotateY:-2}} transition={{duration:.45}}>
        {cover?<Image src={cover} alt={title+' — capa do jogo'} fill sizes="(max-width: 700px) 34vw, 220px" priority/>:<div className="detail-cover-placeholder" aria-hidden="true"><Gamepad2/></div>}
      </motion.div>
      <motion.div className="detail-heading" initial={reduced?false:{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.45,delay:.08}}>
        {genre&&<p className="eyebrow">{genre}</p>}
        <h1><FallingText text={title}/></h1>
        {description&&<p className="detail-summary">{description}</p>}
        <div className="detail-quick-meta">
          <span className="rating">{rating}</span>
          {platforms.map(platform=><span className="detail-platform" key={platform}>{platform}</span>)}
        </div>
      </motion.div>
      <motion.div className="detail-purchase" initial={reduced?false:{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.45,delay:.16}}>
        {purchase}
      </motion.div>
    </div>
  </section>;
}
