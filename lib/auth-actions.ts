'use server';

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
    callback.searchParams.set('next', next);
    const { data, error } = await client.auth.signUp({
      email, password, options:{ emailRedirectTo:callback.toString(), data:{ display_name:displayName, terms_accepted_at:new Date().toISOString() } },
    });
    if (error) return { error:authError(error.code) };
    if (data.session) redirect(next);
    return { success:'Se o cadastro puder ser confirmado, você receberá as instruções por e-mail. Se já tiver conta, entre ou recupere sua senha.' };
  }

  if (kind === 'forgot') {
    const input = email.safeParse(values.email);
    if (!input.success) return { error:'Informe um e-mail válido.' };
    const callback = new URL('/auth/callback', siteUrl());
    callback.searchParams.set('next','/reset-password');
    const { error } = await client.auth.resetPasswordForEmail(input.data,{redirectTo:callback.toString()});
    if (error && error.code !== 'user_not_found') return { error:authError(error.code) };
    return { success:'Se houver uma conta com esse e-mail, você receberá um link de recuperação.' };
  }

  const current = await requireSession('/reset-password');
  const input = password.safeParse(values.password);
  if (!input.success || input.data !== values.confirm) return { error:'Use uma senha válida de pelo menos 8 caracteres e repita a mesma senha.' };
  const { error } = await current.client.auth.updateUser({password:input.data});
  if (error) return {error:authError(error.code)};
  return {success:'Senha atualizada.'};
}

export async function signOut(_previous: ActionState, _form: FormData): Promise<ActionState> {
  void _form;
  const { client } = await requireSession('/account');
  const {error} = await client.auth.signOut({scope:'local'});
  if (error) return {error:'Não foi possível sair da conta.'};
  redirect('/');
}
