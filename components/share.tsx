'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';

export function Share({ title }: {title:string}) {
  const [message,setMessage]=useState('');
  return <div><button className="button secondary" onClick={async()=>{
    try {
      if(navigator.share) await navigator.share({title,url:location.href});
      else {
        await navigator.clipboard.writeText(location.href);
        setMessage('Link copiado.');
      }
    } catch(error) {
      if(!(error instanceof DOMException && error.name==='AbortError')) setMessage('Não foi possível compartilhar. Copie o endereço da página.');
    }
  }}><Share2 size={16}/>Compartilhar</button><span role="status" className="muted">{message}</span></div>;
}
