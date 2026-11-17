import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { nextPath } from '@/lib/rules';
import { siteUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const client = await db();
  const token = params.get('token_hash');
  const code = params.get('code');
  const type = params.get('type');
  const target = nextPath(params.get('next'));
  const recovery=type === 'recovery' || target === '/reset-password';
  const destination = new URL(recovery ? '/reset-password' : '/auth/confirmed', siteUrl());
  if (!recovery) destination.searchParams.set('next',target);
  if (client) {
    const result = token && (type === 'email' || type === 'signup' || type === 'recovery')
      ? await client.auth.verifyOtp({token_hash:token, type})
      : code ? await client.auth.exchangeCodeForSession(code) : null;
    if (result && !result.error) {
      const response = NextResponse.redirect(destination);
      response.headers.set('Cache-Control','private, no-store');
      return response;
    }
  }
  return NextResponse.redirect(new URL('/login?erro=link', siteUrl()));
}
