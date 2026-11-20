import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { forbidden, redirect } from 'next/navigation';
import { cache } from 'react';
import { supabaseConfig } from './config';
import { nextPath } from './rules';

export const db = cache(async () => {
  const config = supabaseConfig();
  if (!config) return null;
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: values => {
        try {
          values.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Server components receive refreshed cookies from proxy.ts.
        }
      },
    },
  });
});

export const session = cache(async () => {
  const client = await db();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user && { client, user: data.user };
});

export async function requireSession(path: string) {
  const current = await session();
  if (!current) redirect('/login?next=' + encodeURIComponent(nextPath(path)));
  return current;
}

export const roleOf = cache(async () => {
  const current = await session();
  if (!current) return null;
  const { data, error } = await current.client.from('profiles').select('role').eq('id', current.user.id).single();
  if (error) throw new Error('Não foi possível verificar o perfil.');
  return data.role as 'player' | 'developer' | 'admin';
});

export async function requireRole(role: 'developer' | 'admin', path: string) {
  const current = await requireSession(path);
  const actual = await roleOf();
  if (actual !== 'admin' && actual !== role) forbidden();
  return current;
}
