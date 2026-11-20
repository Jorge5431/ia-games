import { session } from '@/lib/supabase';
import { nextPath } from '@/lib/rules';
import { EmailConfirmed } from '@/components/email-confirmed';
export const metadata={title:'Confirmação de e-mail',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{next?:string}>}){
  const [current,params]=await Promise.all([session(),searchParams]);
  return <EmailConfirmed confirmed={Boolean(current?.user.email_confirmed_at)} next={nextPath(params.next)}/>;
}
