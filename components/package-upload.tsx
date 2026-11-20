'use client';
import {useRef,useState} from 'react';
import {ActionForm} from './action-form';
import {uploadPackage} from '@/lib/portal-actions';
export function PackageUpload({id}:{id:string}){
 const input=useRef<HTMLInputElement>(null);const [name,setName]=useState('');
 return <ActionForm action={uploadPackage.bind(null,id)} label="Enviar ZIP privado"><label className="field panel" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f&&input.current){const d=new DataTransfer();d.items.add(f);input.current.files=d.files;setName(f.name);}}}>Arraste seu ZIP aqui ou selecione um arquivo<input ref={input} type="file" name="package" accept=".zip,application/zip" required onChange={e=>setName(e.target.files?.[0]?.name??'')}/><small>{name||'Até 2 MB nesta versão. Arquivos maiores: use um link.'}</small></label></ActionForm>;
}
