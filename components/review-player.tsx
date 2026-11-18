'use client';
import {useState} from 'react';
export function ReviewPlayer({url}:{url:string}){
 const [open,setOpen]=useState(false);
 return <section className="stack"><p>Prévia isolada de jogo externo. Não informe dados pessoais. Este teste não registra jogadores na telemetria.</p><button type="button" className="button secondary" onClick={()=>setOpen(v=>!v)}>{open?'Encerrar teste':'Testar jogo no site'}</button>{open&&<iframe title="Teste de moderação" src={url} sandbox="allow-scripts allow-pointer-lock" referrerPolicy="no-referrer" style={{width:'100%',height:'65vh',border:0}}/>}<small>Alguns jogos bloqueiam incorporação. O teste não substitui análise de segurança.</small></section>;
}
