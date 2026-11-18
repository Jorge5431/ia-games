export function inspectZip(bytes:Uint8Array){
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50&&i+22+v.getUint16(i+20,true)===bytes.length){end=i;break;}
 if(end<0)throw Error('ZIP inválido');
 const count=v.getUint16(end+10,true),size=v.getUint32(end+12,true);let pos=v.getUint32(end+16,true),total=0;const limit=pos+size;let entry='';
 if(!count||count>2000||limit!==end||v.getUint16(end+4,true)||v.getUint16(end+6,true)||v.getUint16(end+8,true)!==count)throw Error('ZIP não suportado');
 for(let i=0;i<count;i++){if(pos+46>limit||v.getUint32(pos,true)!==0x02014b50)throw Error('ZIP inválido');
 const flags=v.getUint16(pos+8,true),method=v.getUint16(pos+10,true),n=v.getUint16(pos+28,true),extra=v.getUint16(pos+30,true),comment=v.getUint16(pos+32,true),expanded=v.getUint32(pos+24,true),mode=v.getUint32(pos+38,true)>>>16;
 if(pos+46+n+extra+comment>limit||flags&1||![0,8].includes(method)||(mode&0xf000)===0xa000)throw Error('Entrada não permitida');
 const name=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(pos+46,pos+46+n));
 if(!name||name.startsWith('/')||name.includes('\\')||name.includes(':')||name.split('/').includes('..')||/[\x00-\x1f]/.test(name))throw Error('Caminho inseguro');
 total+=expanded;if(total>50*1024*1024)throw Error('ZIP expandido muito grande');
 if(/(^|\/)index\.html$/i.test(name)&&(!entry||name.length<entry.length))entry=name;
 pos+=46+n+extra+comment;
 }if(pos!==limit)throw Error('ZIP inválido');return {entry,kind:entry?'html_zip':'windows_zip'};
}
