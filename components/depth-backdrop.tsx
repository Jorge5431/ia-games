'use client';
import { motion,useScroll,useTransform } from 'motion/react';
import { useRef } from 'react';
import { usePreferences } from './preferences-provider';

export function DepthBackdrop(){
  const ref=useRef<HTMLDivElement>(null);
  const {preferences}=usePreferences();
  const reduced=preferences.motion==='reduced';
  const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});
  const near=useTransform(scrollYProgress,[0,1],[65,-65]);
  const far=useTransform(scrollYProgress,[0,1],[-30,30]);
  const turn=useTransform(scrollYProgress,[0,1],[-12,12]);
  return <div className="depth-backdrop" ref={ref} aria-hidden="true">
    <motion.span className="depth-halo" style={reduced?undefined:{y:far}}/>
    <motion.span className="depth-ring" style={reduced?undefined:{y:near,rotate:turn}}/>
    <motion.span className="depth-cross" style={reduced?undefined:{y:far,rotate:turn}}/>
    <motion.span className="depth-line" style={reduced?undefined:{y:near}}/>
  </div>;
}
