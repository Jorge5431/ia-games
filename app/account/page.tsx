import { Crown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { requireSession } from '@/lib/supabase';
import { publicImage } from '@/lib/catalog';
import { AccountShell, SignOut } from '@/components/account-shell';

export const metadata={title:'Minha conta'};

export default async function Page() {
  const {client,user}=await requireSession('/account');
  const {data,error}=await client.from('profiles').select('username,display_name,avatar_url,bio,role').eq('id',user.id).single();
  if(error||!data) throw new Error('Perfil indisponível.');
  const avatar=publicImage(data.avatar_url,'avatars');
  return <AccountShell title="Minha conta"><div className="panel">
    {avatar && <Image src={avatar} alt="" className="avatar" width={78} height={78}/>}
    <h2>{data.display_name||'Jogador'}</h2>{data.username && <p className="muted">@{data.username}</p>}
    {user.id==='d85bf8a9-8e6c-469a-99cb-3ebbeec6b4cb'?<p style={{color:'#ff8033',fontWeight:700,display:'flex',alignItems:'center',gap:6}}><Crown size={16}/> CRIADOR</p>:data.role==='developer'?<p style={{color:'#ff8033',fontWeight:700}}>DESENVOLVEDOR</p>:null}
    {data.bio && <p>{data.bio}</p>}
    <div className="toolbar"><Link className="button" href="/account/profile">Editar perfil</Link><SignOut/></div>
  </div></AccountShell>;
}
