'use client';
import {motion,useScroll,useTransform} from 'motion/react';
import {useRef} from 'react';
import {ChevronDown} from 'lucide-react';
import {useGentleMotion} from './preferences-provider';

export function Hero(){
 const section=useRef<HTMLElement>(null);
 const reduced=useGentleMotion();
 const {scrollYProgress}=useScroll({target:section,offset:['start start','end start']});
 const opacity=useTransform(scrollYProgress,[0,.25,1],[1,1,0]);
 const y=useTransform(scrollYProgress,[0,1],['0%','18%']);
 return <section ref={section} className="immersive-hero" aria-label="Vornelix — Gaming Reimagined">
  <motion.div className="immersive-art" style={reduced?undefined:{opacity,y}} aria-hidden="true"/>
  <div className="immersive-fade" aria-hidden="true"/>
  <h1 className="sr-only">VORNELIX — Gaming Reimagined</h1>
  <a href="#home-catalog" className="immersive-scroll">Explorar jogos <ChevronDown size={22}/></a>
 </section>;
}
