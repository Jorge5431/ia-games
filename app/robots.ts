import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {rules:{userAgent:'*',allow:'/',disallow:['/account','/admin','/developer','/library','/wishlist','/downloads','/checkout','/auth']},sitemap:new URL('/sitemap.xml',siteUrl()).href};
}
