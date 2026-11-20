'use client';
import { usePreferences } from './preferences-provider';

import Image from 'next/image';
import { DepthBackdrop } from './depth-backdrop';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { useRef, useState } from 'react';

export function Gallery({images,title}: {images:string[];title:string}) {
  const [active,setActive]=useState(0);
  const dialog=useRef<HTMLDialogElement>(null);
  const {preferences}=usePreferences();
  const reduced=preferences.motion==='reduced';
  if(images.length<3) return null;
  const move = (step:number) => setActive((active+step+images.length)%images.length);
  return <section aria-label="Galeria de imagens" className="gallery detail-reveal" onKeyDown={event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();
      move(event.key==='ArrowLeft'?-1:1);
    }
  }}>
    <DepthBackdrop/><div className="gallery-feature"><AnimatePresence initial={false}>
      <motion.div key={active} className="gallery-frame" initial={{opacity:0,x:reduced?0:16}} animate={{opacity:1,x:0}} exit={{opacity:0}} transition={{duration:reduced?0:.28}}>
        <Image src={images[active]} alt={title+' — imagem '+(active+1)} fill sizes="(max-width: 800px) 100vw, 66vw"/>
      </motion.div>
    </AnimatePresence><button className="gallery-expand icon-button" type="button" aria-label="Ampliar imagem" onClick={()=>dialog.current?.showModal()}><Maximize2 size={18}/></button></div>
    {images.length>1 && <div className="gallery-controls">
      <button className="icon-button" aria-label="Imagem anterior" onClick={()=>move(-1)}><ChevronLeft/></button>
      <div className="thumbnails">{images.map((image,index)=><button key={image+index} aria-label={'Mostrar imagem '+(index+1)} aria-pressed={active===index} onClick={()=>setActive(index)}><Image src={image} width={96} height={54} alt=""/></button>)}</div>
      <button className="icon-button" aria-label="Próxima imagem" onClick={()=>move(1)}><ChevronRight/></button>
    </div>}
    <dialog className="gallery-dialog" ref={dialog} aria-label={'Galeria ampliada de '+title} onClick={event=>{if(event.target===dialog.current) dialog.current?.close();}}>
      <div className="gallery-dialog-bar"><span>{active+1} / {images.length}</span><button className="icon-button" type="button" aria-label="Fechar imagem ampliada" onClick={()=>dialog.current?.close()}><X size={20}/></button></div>
      <div className="gallery-expanded-frame"><AnimatePresence initial={false}>
        <motion.div key={active} className="gallery-frame" initial={{opacity:0,x:reduced?0:16}} animate={{opacity:1,x:0}} exit={{opacity:0}} transition={{duration:reduced?0:.28}}>
          <Image src={images[active]} alt={title+' — imagem '+(active+1)} fill sizes="96vw"/>
        </motion.div>
      </AnimatePresence></div>
      {images.length>1&&<div className="gallery-dialog-controls"><button className="icon-button" type="button" aria-label="Imagem anterior" onClick={()=>move(-1)}><ChevronLeft/></button><button className="icon-button" type="button" aria-label="Próxima imagem" onClick={()=>move(1)}><ChevronRight/></button></div>}
    </dialog>
  </section>;
}
