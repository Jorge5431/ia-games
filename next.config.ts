import type { NextConfig } from 'next';

const backend = process.env.NEXT_PUBLIC_SUPABASE_URL;
const remotePatterns = backend ? [new URL('/storage/v1/object/public/**', backend)] : [];
const config: NextConfig = {
  experimental: { authInterrupts: true, serverActions: { bodySizeLimit: '11mb' } },
  images: { remotePatterns, dangerouslyAllowLocalIP: process.env.VORNELIX_LOCAL_TEST === '1' },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
    ] }];
  },
};
export default config;
