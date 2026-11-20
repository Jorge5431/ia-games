import Image from 'next/image';
import { AvatarCrop } from '@/components/avatar-crop';
import { requireSession } from '@/lib/supabase';
import { publicImage } from '@/lib/catalog';
import { updateProfile } from '@/lib/player-actions';
import { AccountShell } from '@/components/account-shell';
import { ActionForm, Field, Notes } from '@/components/action-form';

export const metadata={title:'Editar perfil'};

export default async function Page() {
  const {client,user}=await requireSession('/account/profile');
  const {data,error}=await client.from('profiles').select('username,display_name,bio,avatar_url').eq('id',user.id).single();
  if(error||!data) throw new Error('Perfil indisponível.');
  const avatar=publicImage(data.avatar_url,'avatars');
  return <AccountShell title="Editar perfil">
    <div className="panel"><ActionForm action={updateProfile} label="Salvar perfil">
      <Field name="display_name" label="Nome de exibição" value={data.display_name} min={2} max={60} required/>
      <Field name="username" label="Nome de usuário" value={data.username} min={3} max={24} required/>
      <Notes name="bio" label="Biografia" value={data.bio} maxLength={500}/>
    </ActionForm></div>
    <div className="panel"><h2>Avatar</h2>{avatar && <Image src={avatar} alt="Seu avatar" className="avatar" width={78} height={78}/>}
      <AvatarCrop/>
    </div>
  </AccountShell>;
}
