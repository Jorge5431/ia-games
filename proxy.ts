import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfig } from '@/lib/config';

export async function proxy(request: NextRequest) {
  const config = supabaseConfig();
  let response = NextResponse.next({ request });
  if (!config) return response;
  const client = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        if (headers) new Headers(headers).forEach((value, name) => response.headers.set(name, value));
      },
    },
  });
  await client.auth.getClaims();
  if (response.cookies.getAll().length) response.headers.set('Cache-Control','private, no-store');
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|.*\\.(?:ico|svg|png|jpg|jpeg|webp|avif|woff2)$).*)'] };
