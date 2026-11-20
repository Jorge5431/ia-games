import Link from 'next/link';
import {cookies} from 'next/headers';
import { authenticate, recoverWithCode } from '@/lib/auth-actions';
import { nextPath } from '@/lib/rules';
import { requireSession } from '@/lib/supabase';
import { ActionForm, Field } from './action-form';
import { RegistrationPassword } from './registration-password';

const titles = { login:'Entre na Vornelix', register:'Crie sua conta', forgot:'Recupere sua senha', reset:'Defina sua nova senha' };
const labels = { login:'Entrar', register:'Cadastrar', forgot:'Enviar código', reset:'Redefinir senha' };

export async function AuthPage({kind, query}: {kind:keyof typeof titles; query:Promise<Record<string,string | string[] | undefined>>}) {
  const params = await query;
  if (kind === 'reset') await requireSession('/reset-password');
  const next = nextPath(params.next);
  const recoveryEmail=kind==='forgot'?(await cookies()).get('vornelix_recovery_email')?.value:undefined;
  if(kind==='forgot'&&params.etapa==='codigo')return <section className="auth-shell"><div className="panel auth-panel"><h1>Crie uma nova senha</h1><p>Se existir uma conta com o e-mail informado, você receberá um código de seis dígitos. Confira também o spam.</p><ActionForm action={recoverWithCode} label="Redefinir senha">{!recoveryEmail&&<Field name="email" label="E-mail" type="email" required/>}<label className="field">Código de verificação<input name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required/></label><Field name="password" label="Nova senha" type="password" autoComplete="new-password" min={8} required/><Field name="confirm" label="Confirme a nova senha" type="password" autoComplete="new-password" min={8} required/></ActionForm>{recoveryEmail&&<ActionForm action={authenticate.bind(null,'forgot')} label="Reenviar código" secondary><input type="hidden" name="email" value={recoveryEmail}/></ActionForm>}<div className="auth-links"><Link href="/forgot-password">Alterar e-mail</Link><Link href="/login">Voltar ao login</Link></div></div></section>;
  return <section className="auth-shell"><div className="panel auth-panel">
    <h1>{titles[kind]}</h1>{params.senha==='atualizada'&&<p className="feedback success">Senha atualizada! Entre com sua nova senha.</p>}{kind==='forgot'&&<p className="muted">Informe seu e-mail para receber um código de recuperação de seis dígitos.</p>}
    {params.erro === 'link' && <p role="alert" className="feedback error">A recuperação expirou ou é inválida. Solicite um novo código. <Link href="/forgot-password">Recuperar senha</Link></p>}
    <ActionForm action={authenticate.bind(null,kind)} label={labels[kind]}>
      <input type="hidden" name="next" value={next}/>
      {kind === 'register' && <Field name="displayName" label="Nome de exibição" autoComplete="nickname" max={60} required/>}
      {kind !== 'reset' && <Field name="email" label="E-mail" type="email" autoComplete="email" required max={254}/>}
      {(kind === 'login' || kind === 'reset') && <Field name="password" label="Senha" type="password" autoComplete={kind === 'login' ? 'current-password' : 'new-password'} min={kind === 'login' ? undefined : 8} required/>}
      {kind === 'register' && <RegistrationPassword/>}
      {kind === 'reset' && <Field name="confirm" label="Confirme a senha" type="password" autoComplete="new-password" required/>}
      {kind === 'register' && <label className="check"><input name="terms" type="checkbox" required/><span>Li e aceito os <Link href="/terms" target="_blank">termos de uso</Link>.</span></label>}
    </ActionForm>
    <div className="auth-links">
      {kind==='forgot'&&<Link href="/forgot-password?etapa=codigo">Já tenho um código</Link>}
      {kind === 'login' ? <><Link href={'/register?next='+encodeURIComponent(next)}>Criar conta</Link><Link href="/forgot-password">Esqueci minha senha</Link></> : <Link href={'/login?next='+encodeURIComponent(next)}>Ir para o login</Link>}
    </div>
  </div></section>;
}
