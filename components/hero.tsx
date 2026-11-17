'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type Slide = { title:string; summary:string; href:string; image:string|null };
const INTERVAL = 6500;

export function Hero({ slides }: {slides:Slide[]}) {
  const reduced = useReducedMotion();
  const [index,setIndex] = useState(0);
  const [paused,setPaused] = useState(false);
  const [interacting,setInteracting] = useState(false);
  const [focused,setFocused] = useState(false);
  const touch = useRef(0);
  const section = useRef<HTMLElement>(null);
  const {scrollYProgress} = useScroll({target:section,offset:['start start','end start']});
  const y = useTransform(scrollYProgress,[0,1],['0%','9%']);
  const rotating = slides.length>1;
  const active = rotating && !paused && !interacting && !focused && !reduced;

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setIndex(current => (current+1)%slides.length),INTERVAL);
    return () => window.clearTimeout(timer);
  },[active,index,slides.length]);

  function move(offset:number) {
    setIndex(current => (current + offset + slides.length) % slides.length);
  }

  const slide = slides[index];
  return <section ref={section} className="hero" aria-label={rotating ? 'Jogos em destaque' : 'Vornelix'}
    onPointerEnter={event => { if(event.pointerType==='mouse') setInteracting(true); }}
    onPointerLeave={() => setInteracting(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => { if(!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onTouchStart={event => {touch.current=event.touches[0].clientX;}}
    onTouchEnd={event => {const distance=event.changedTouches[0].clientX-touch.current; if(rotating && Math.abs(distance)>45) move(distance>0 ? -1:1);}}
    onKeyDown={event => {
      if (!rotating) return;
      if(event.key==='ArrowLeft' || event.key==='ArrowRight') {
        event.preventDefault();
        move(event.key==='ArrowLeft' ? -1 : 1);
      }
    }}>
    <AnimatePresence initial={false}>
      <motion.div key={slide.href} className="hero-art" aria-hidden initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.4}}>
        {slide.image ? <motion.div className="hero-image-track" style={{y}}><Image src={slide.image} alt="" fill sizes="100vw" className="hero-image" priority={index===0}/></motion.div> :
          <div className="institution-art"><div className="art-grid"/><span className="art-orbit"/><Image src="/marca-vornelix.webp" alt="" width={380} height={380} priority/></div>}
      </motion.div>
    </AnimatePresence>
    <div className="hero-shade"/>
    <div className="hero-content">
      <AnimatePresence initial={false} mode="wait"><motion.div key={slide.title}
        initial={reduced ? false : {opacity:0,y:12}} animate={{opacity:1,y:0}} exit={reduced ? undefined : {opacity:0,y:-6}} transition={{duration:.2}}>
        <p className="eyebrow">{rotating || slide.image ? 'Em destaque' : 'VORNELIX'}</p>
        <h1>{slide.title}</h1>
        <p>{slide.summary}</p>
        <Link className="button" href={slide.href}>{slide.href==='/store' ? 'Explorar loja' : 'Ver detalhes'}<ArrowRight size={18}/></Link>
      </motion.div></AnimatePresence>
      {rotating && <div className="hero-controls" aria-label="Controles do banner">
        <button type="button" className="icon-button" aria-label="Anterior" onClick={()=>move(-1)}><ChevronLeft size={19}/></button>
        <button type="button" className="icon-button" aria-label="Próximo" onClick={()=>move(1)}><ChevronRight size={19}/></button>
        <button type="button" className="icon-button" aria-label={paused ? 'Reproduzir banner' : 'Pausar banner'} onClick={()=>setPaused(value=>!value)}>{paused ? <Play size={16}/> : <Pause size={16}/>}</button>
        <div className="dots">{slides.map((item,number)=><button key={item.href} type="button" aria-current={number===index ? 'true':undefined} aria-label={'Slide '+(number+1)} onClick={()=>setIndex(number)}>
          {number===index && active && <motion.span initial={{scaleX:0}} animate={{scaleX:1}} transition={{duration:INTERVAL/1000,ease:'linear'}}/>}
        </button>)}</div>
      </div>}
    </div>
  </section>;
}
