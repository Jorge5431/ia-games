'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import type { ReactNode } from 'react';

export function CardMotion({children,index=0,tilt=false}: {children:ReactNode;index?:number;tilt?:boolean}) {
  const reduced=useReducedMotion();
  const x=useMotionValue(0);
  const y=useMotionValue(0);
  const rotateX=useSpring(x,{stiffness:250,damping:25});
  const rotateY=useSpring(y,{stiffness:250,damping:25});
  return <motion.article className="game-card" style={tilt ? {rotateX,rotateY,transformPerspective:1000} : undefined}
    initial={false} whileInView={reduced ? undefined : { y:[5,0] }}
    viewport={{once:true,amount:.15}} transition={{duration:.28,delay:Math.min(index,7)*.045}}
    whileTap={reduced ? undefined : {scale:.98,transition:{duration:.12}}}
    onPointerMove={event=>{
      if(!tilt||reduced||event.pointerType!=='mouse') return;
      const bounds=event.currentTarget.getBoundingClientRect();
      x.set((.5-(event.clientY-bounds.top)/bounds.height)*5);
      y.set(((event.clientX-bounds.left)/bounds.width-.5)*5);
    }}
    onPointerLeave={()=>{x.set(0);y.set(0);}}>{children}</motion.article>;
}
