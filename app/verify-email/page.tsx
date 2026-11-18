import { cookies } from 'next/headers';
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { ActionForm } from '@/components/action-form';
import { verifyRegistration,resendRegistration } from '@/lib/auth-actions';
export const metadata={title:'Verificar e-mail',robots:{index:false,follow:false}};
export default async function Page(){
 const pending=(await cookies()).get('vornelix_pending_email')?.value;
 return <section className="auth-shell"><div className="panel auth-panel otp-panel"><Brand/><h1>Verifique seu e-mail</h1>{pending?<><p className="muted">Digite o código de seis dígitos enviado ao e-mail cadastrado.</p><ActionForm action={verifyRegistration} label="Confirmar e-mail"><label className="field">Código de confirmação<input className="otp-input" name="token" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required placeholder="000000"/></label></ActionForm><ActionForm action={resendRegistration} label="Reenviar código" secondary/></>:<p>Inicie o cadastro para receber seu código.</p>}<Link href="/register">Voltar ao cadastro</Link><Link href="/login">Já tenho conta</Link></div></section>;
}
