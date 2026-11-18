import Link from 'next/link';
import { authenticate, recoverWithCode } from '@/lib/auth-actions';
import { nextPath } from '@/lib/rules';
import { requireSession } from '@/lib/supabase';
import { ActionForm, Field } from './action-form';
import { RegistrationPassword } from './registration-password';

const titles = { login:'Entre na Vornelix', register:'Crie sua conta', forgot:'Recupere sua senha', reset:'Defina sua nova senha' };
const labels = { login:'Entrar', register:'Cadastrar', forgot:'Enviar link', reset:'Redefinir senha' };

export async function AuthPage({kind, query}: {kind:keyof typeof titles; query:Promise<Record<string,string | string[] | undefined>>}) {
  const params = await query;
  if (kind === 'reset') await requireSession('/reset-password');
  const next = nextPath(params.next);
  return <section className="auth-shell"><div className="panel auth-panel">
    <h1>{titles[kind]}</h1>{params.senha==='atualizada'&&<p className="feedback success">Senha atualizada! Entre com sua nova senha.</p>}{kind==='forgot'&&<p className="muted">Informe seu e-mail. Abra o link recebido no mesmo navegador em que solicitou a recuperação. Confira também o spam.</p>}
    {params.erro === 'link' && <p role="alert" className="feedback error">O link expirou ou é inválido. Solicite um novo link. <Link href="/forgot-password">Recuperar senha</Link></p>}
    <ActionForm action={authenticate.bind(null,kind)} label={labels[kind]}>
      <input type="hidden" name="next" value={next}/>
      {kind === 'register' && <Field name="displayName" label="Nome de exibição" autoComplete="nickname" max={60} required/>}
      {kind !== 'reset' && <Field name="email" label="E-mail" type="email" autoComplete="email" required max={254}/>}
      {(kind === 'login' || kind === 'reset') && <Field name="password" label="Senha" type="password" autoComplete={kind === 'login' ? 'current-password' : 'new-password'} min={kind === 'login' ? undefined : 8} required/>}
      {kind === 'register' && <RegistrationPassword/>}
      {kind === 'reset' && <Field name="confirm" label="Confirme a senha" type="password" autoComplete="new-password" required/>}
      {kind === 'register' && <label className="check"><input name="terms" type="checkbox" required/><span>Li e aceito os <Link href="/terms" target="_blank">termos de uso</Link>.</span></label>}
    </ActionForm>
    {kind==="forgot"&&<><h2>Já recebeu um código?</h2><ActionForm action={recoverWithCode} label="Redefinir com código"><Field name="email" label="E-mail" type="email" required/><Field name="token" label="Código de seis dígitos" required max={6}/><Field name="password" label="Nova senha" type="password" min={8} required/><Field name="confirm" label="Confirme a senha" type="password" required/></ActionForm></>}<div className="auth-links">
      {kind === 'login' ? <><Link href={'/register?next='+encodeURIComponent(next)}>Criar conta</Link><Link href="/forgot-password">Esqueci minha senha</Link></> : <Link href={'/login?next='+encodeURIComponent(next)}>Ir para o login</Link>}
    </div>
  </div></section>;
}
