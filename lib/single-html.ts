import 'server-only';
import {inflateRawSync} from 'node:zlib';
import {inspectZip} from './zip-inspect';
export function singleHtml(bytes:Uint8Array){
 const info=inspectZip(bytes);if(!info.entry)throw Error('HTML ausente');
 const b=Buffer.from(bytes);let end=b.length-22;while(end>=Math.max(0,b.length-65557)&&(b.readUInt32LE(end)!==0x06054b50||end+22+b.readUInt16LE(end+20)!==b.length))end--;if(end<0)throw Error('ZIP inválido');
 let p=b.readUInt32LE(end+16);const count=b.readUInt16LE(end+10);let html='';
 for(let i=0;i<count;i++){const n=b.readUInt16LE(p+28),x=b.readUInt16LE(p+30),c=b.readUInt16LE(p+32),name=b.toString('utf8',p+46,p+46+n);
 if(name===info.entry){const size=b.readUInt32LE(p+20),expanded=b.readUInt32LE(p+24),off=b.readUInt32LE(p+42);if(expanded>2097152||off+30>b.length||b.readUInt32LE(off)!==0x04034b50)throw Error('HTML inválido');const start=off+30+b.readUInt16LE(off+26)+b.readUInt16LE(off+28);if(start+size>b.length)throw Error('ZIP inválido');const raw=b.subarray(start,start+size);const out=b.readUInt16LE(p+10)===0?raw:inflateRawSync(raw,{maxOutputLength:2097152});if(out.length!==expanded)throw Error('ZIP inválido');html=out.toString('utf8');}
 p+=46+n+x+c;}
 if(!html)throw Error('HTML vazio');return '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'; frame-src \'none\'">'+html;
}
