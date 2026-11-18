'use client';
import {useEffect,useState,useRef,useCallback} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {Bell} from 'lucide-react';
import Link from 'next/link';
type Notice={id:string;title:string;body:string;href:string;created_at:string;read_at:string|null};
export function NotificationBell(){
 const [items,setItems]=useState<Notice[]>([]),[count,setCount]=useState(0),[open,setOpen]=useState(false),[failed,setFailed]=useState(false);
 const root=useRef<HTMLDivElement>(null);
 const [client]=useState(()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!));
 const refresh=useCallback(async()=>{const [list,unread]=await Promise.all([client.from('notifications').select('id,title,body,href,created_at,read_at').order('created_at',{ascending:false}).limit(30),client.from('notifications').select('id',{count:'exact',head:true}).is('read_at',null)]);setFailed(Boolean(list.error||unread.error));if(!list.error)setItems(list.data??[]);if(!unread.error)setCount(unread.count??0);},[client]);
 useEffect(()=>{void refresh();const timer=setInterval(()=>void refresh(),20000);return()=>clearInterval(timer);},[refresh]);
 useEffect(()=>{function close(e:PointerEvent){if(!root.current?.contains(e.target as Node))setOpen(false);}document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 async function mark(id?:string){let q=client.from('notifications').update({read_at:new Date().toISOString()}).is('read_at',null);if(id)q=q.eq('id',id);await q;await refresh();}
 return <div className="notification-root" ref={root} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}><button type="button" className={'icon-button notification-bell'+(count?' has-unread':'')} aria-label={'Notificações: '+count+' não lidas'} aria-expanded={open} onClick={()=>{setOpen(!open);void refresh();}}><Bell size={21}/>{count>0&&<span className="notification-count">{count>99?'99+':count}</span>}</button>{open&&<section className="notification-menu" aria-label="Notificações"><div className="notification-heading"><strong>Notificações</strong><button type="button" onClick={()=>void mark()}>Marcar todas como lidas</button></div>{failed?<p>Não foi possível atualizar as notificações.</p>:!items.length?<p>Você está em dia!</p>:items.map(n=><Link className={'notification-item'+(!n.read_at?' unread':'')} key={n.id} href={n.href} onClick={()=>{void mark(n.id);setOpen(false);}}><strong>{n.title}</strong><span>{n.body}</span><small>{new Date(n.created_at).toLocaleString('pt-BR')}</small></Link>)}</section>}</div>;
}
