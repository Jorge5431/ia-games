'use client';
import { motion } from 'motion/react';
import { useGentleMotion } from './preferences-provider';

export function FallingText({text, subtle=false}:{text:string;subtle?:boolean}) {
  const reduced=useGentleMotion();
  if(reduced || text.length>160) return <>{text}</>;
  let index=0;
  return <motion.span key={text} initial="waiting" whileInView="visible" viewport={{once:true,amount:0.12}} role="img" aria-label={text} style={{display:'inline-block',maxWidth:'100%'}}>
    <span aria-hidden="true">{text.split(/(\s+)/u).map((word,w)=>/^\s+$/u.test(word)?word:<span key={w} style={{display:'inline-block',whiteSpace:'nowrap',maxWidth:'100%'}}>{Array.from(word).map((letter,i)=>{
      const delay=Math.min(index++*.035,.75);
      return <motion.span key={i} style={{display:'inline-block'}} variants={{waiting:{opacity:0,y:subtle?-16:-46,rotate:subtle?0:-5},visible:{opacity:1,y:[subtle?-16:-46,subtle?1:3,0],rotate:0,transition:{duration:subtle?.46:.72,delay,ease:[.22,.8,.22,1]}}}}>{letter}</motion.span>;
    })}</span>)}</span>
  </motion.span>;
}
