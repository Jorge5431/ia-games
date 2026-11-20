'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db, requireSession } from './supabase';
import { siteUrl } from './config';
import { email, nextPath, password } from './rules';
import type { ActionState } from '@/components/action-form';

const signin = z.object({email, password:z.string().min(1).max(200)});
const register = z.object({email, password, confirm:z.string(), displayName:z.string().trim().min(2).max(60), terms:z.literal('on')});

function authError(code?: string) {
  switch (code) {
    case 'invalid_credentials': return 'E-mail ou senha incorretos.';
    case 'email_not_confirmed': return 'Confirme seu e-mail antes de entrar.';
    case 'user_already_exists':
    case 'email_exists': return 'Este e-mail já é usado. Entre ou recupere a senha.';
    case 'weak_password': return 'Escolha uma senha mais forte.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit': return 'Muitas tentativas. Tente novamente em alguns minutos.';
    case 'same_password': return 'Escolha uma senha diferente da atual.';
    default: return 'A operação de autenticação falhou. Tente novamente.';
  }
}

export async function authenticate(kind: 'login' | 'register' | 'forgot' | 'reset', _previous: ActionState, form: FormData): Promise<ActionState> {
  const client = await db();
  if (!client) return { error:'A autenticação está indisponível. Tente novamente mais tarde.' };
  const values = Object.fromEntries(form);
  const next = nextPath(form.get('next'));

  if (kind === 'login') {
    const input = signin.safeParse(values);
    if (!input.success) return { error:'Informe um e-mail válido e sua senha.' };
    const { error } = await client.auth.signInWithPassword(input.data);
    if (error) return { error:authError(error.code) };
    redirect(next);
  }

  if (kind === 'register') {
    const input = register.safeParse(values);
    if (!input.success) return { error:'Confira o nome, o e-mail, a senha de pelo menos 8 caracteres e o aceite dos termos.' };
    const { displayName, email, password, confirm } = input.data;
    if (password !== confirm) return { error:'As senhas precisam ser iguais.' };
    const callback = new URL('/auth/callback', siteUrl());
    callback.searchParams.set('next', '/account');
    const { data, error } = await client.auth.signUp({
      email, password, options:{ emailRedirectTo:callback.toString(), data:{ display_name:displayName, terms_accepted_at:new Date().toISOString() } },
    });
    if (error) return { error:authError(error.code) };
    if (data.session) redirect(next);
    (await cookies()).set('vornelix_pending_email',email,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:3600});
    redirect('/verify-email');
  }

  if (kind === 'forgot') {
    const input = email.safeParse(values.email);
    if (!input.success) return { error:'Informe um e-mail válido.' };
    const callback = new URL('/auth/callback', siteUrl());
    callback.searchParams.set('next','/reset-password');
    const { error } = await client.auth.resetPasswordForEmail(input.data,{redirectTo:callback.toString()});
    if (error && error.code !== 'user_not_found') return { error:authError(error.code) };
    (await cookies()).set('vornelix_recovery_email',input.data,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:1800});
    redirect('/forgot-password?etapa=codigo');
  }

  const current = await requireSession('/reset-password');
  const input = password.safeParse(values.password);
  if (!input.success || input.data !== values.confirm) return { error:'Use uma senha válida de pelo menos 8 caracteres e repita a mesma senha.' };
  const { error } = await current.client.auth.updateUser({password:input.data});
  if (error) return {error:authError(error.code)};
  await current.client.auth.signOut({scope:'local'});
  redirect('/login?senha=atualizada');
}

export async function signOut(_previous: ActionState, _form: FormData): Promise<ActionState> {
  void _form;
  const { client } = await requireSession('/account');
  const {error} = await client.auth.signOut({scope:'local'});
  if (error) return {error:'Não foi possível sair da conta.'};
  redirect('/');
}

export async function verifyRegistration(_previous:ActionState,form:FormData):Promise<ActionState>{
 const jar=await cookies(); const address=jar.get('vornelix_pending_email')?.value;
 const token=String(form.get('token')||'').trim();
 if(!address||!/^\d{6}$/.test(token))return {error:'Informe os seis dígitos recebidos por e-mail.'};
 const client=await db(); if(!client)return {error:'Autenticação indisponível.'};
 const {data,error}=await client.auth.verifyOtp({email:address,token,type:'email'});
 if(error||!data.user?.email_confirmed_at)return {error:'Código inválido ou expirado. Confira ou solicite outro.'};
 jar.delete('vornelix_pending_email'); redirect('/auth/confirmed?next=%2Faccount');
}
export async function resendRegistration():Promise<ActionState>{
 const address=(await cookies()).get('vornelix_pending_email')?.value;
 const client=await db(); if(!address||!client)return {error:'Reinicie o cadastro.'};
 const {error}=await client.auth.resend({type:'signup',email:address});
 return error?{error:'Não foi possível reenviar. Aguarde e tente novamente.'}:{success:'Se houver confirmação pendente, um novo código será enviado.'};
}

export async function recoverWithCode(_previous:ActionState,form:FormData):Promise<ActionState>{
 const jar=await cookies();
 const address=email.safeParse(jar.get('vornelix_recovery_email')?.value || form.get('email')),pass=password.safeParse(form.get('password')),token=String(form.get('token')||'').trim();
 if(!address.success||!pass.success||pass.data!==form.get('confirm')||!/^\d{6}$/.test(token))return {error:'Confira e-mail, código e as duas senhas.'};
 const client=await db();if(!client)return {error:'Autenticação indisponível.'};
 const {data,error}=await client.auth.verifyOtp({email:address.data,token,type:'recovery'});
 if(error||!data.session||!data.user)return {error:'Código inválido ou expirado. Solicite outro.'};
 const result=await client.auth.updateUser({password:pass.data});
 await client.auth.signOut({scope:'local'});
 if(result.error)return {error:authError(result.error.code)+' Solicite um novo código.'};
 jar.delete('vornelix_recovery_email');
 redirect('/login?senha=atualizada');
}
