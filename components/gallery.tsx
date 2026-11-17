'use client';
import { useGentleMotion } from './preferences-provider';

import Image from 'next/image';
import { DepthBackdrop } from './depth-backdrop';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function Gallery({images,title}: {images:string[];title:string}) {
  const [active,setActive]=useState(0);
  const reduced=useGentleMotion();
  if(!images.length) return null;
  const move = (step:number) => setActive((active+step+images.length)%images.length);
  return <section aria-label="Galeria de imagens" className="gallery" onKeyDown={event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();
      move(event.key==='ArrowLeft'?-1:1);
    }
  }}>
    <DepthBackdrop/><div className="gallery-feature"><AnimatePresence initial={false}>
      <motion.div key={active} className="gallery-frame" initial={{opacity:0,x:reduced?0:16}} animate={{opacity:1,x:0}} exit={{opacity:0}} transition={{duration:reduced?0:.28}}>
        <Image src={images[active]} alt={title+' — imagem '+(active+1)} fill sizes="(max-width: 800px) 100vw, 66vw"/>
      </motion.div>
    </AnimatePresence></div>
    {images.length>1 && <div className="gallery-controls">
      <button className="icon-button" aria-label="Imagem anterior" onClick={()=>move(-1)}><ChevronLeft/></button>
      <div className="thumbnails">{images.map((image,index)=><button key={image+index} aria-label={'Mostrar imagem '+(index+1)} aria-pressed={active===index} onClick={()=>setActive(index)}><Image src={image} width={96} height={54} alt=""/></button>)}</div>
      <button className="icon-button" aria-label="Próxima imagem" onClick={()=>move(1)}><ChevronRight/></button>
    </div>}
  </section>;
}
