'use client';
import {motion,useScroll,useTransform} from 'motion/react';
import {useRef} from 'react';
import {ChevronDown} from 'lucide-react';
import {useGentleMotion} from './preferences-provider';

const sparks=Array.from({length:12},(_,i)=>({left:(i*19+9)%96+2,top:35+(i*17)%60,delay:(i%6)*.46,duration:3.8+(i%4)*.8}));

export function Hero(){
 const section=useRef<HTMLElement>(null);
 const reduced=useGentleMotion();
 const {scrollYProgress}=useScroll({target:section,offset:['start start','end start']});
 const opacity=useTransform(scrollYProgress,[0,.15,.75,1],[1,1,.15,0]);
 const y=useTransform(scrollYProgress,[0,1],['0%','14%']);
 const cueOpacity=useTransform(scrollYProgress,[0,.18,.42],[1,1,0]);
 return <section ref={section} className="immersive-hero" aria-label="Vornelix — Gaming Reimagined">
  <motion.div className="immersive-art" style={reduced?undefined:{opacity,y}} aria-hidden="true">
   <div className="immersive-art-image"/>
   {!reduced&&<div className="immersive-embers">{sparks.map((s,i)=><span key={i} style={{left:s.left+'%',top:s.top+'%',animationDelay:s.delay+'s',animationDuration:s.duration+'s'}}/>)}</div>}
  </motion.div>
  <div className="immersive-fade" aria-hidden="true"/>
  <h1 className="sr-only">VORNELIX — Gaming Reimagined</h1>
  <motion.div className="immersive-scroll-wrap" style={reduced?undefined:{opacity:cueOpacity}}>
   <a href="#home-catalog" className="immersive-scroll">Explorar jogos <ChevronDown size={22}/></a>
  </motion.div>
 </section>;
}
