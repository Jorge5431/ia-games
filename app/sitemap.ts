import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/config';
import { db } from '@/lib/supabase';
import { categories } from '@/lib/rules';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin=siteUrl();
  const publicRoutes=['/','/store','/discover','/categories','/search','/about','/support','/terms','/privacy',...categories.map(([slug])=>'/category/'+slug)];
  const entries:MetadataRoute.Sitemap=publicRoutes.map(path=>({url:new URL(path,origin).href}));
  const client=await db();
  if(!client) return entries;
  for(let start=0;start<49000;start+=1000) {
    const {data,error}=await client.from('games').select('slug,updated_at').eq('status','published').not('slug','is',null).order('id').range(start,start+999);
    if(error) throw new Error('Não foi possível consultar o sitemap do catálogo.');
    for(const game of data) entries.push({url:new URL('/game/'+encodeURIComponent(game.slug),origin).href,lastModified:game.updated_at});
    if(data.length<1000) break;
  }
  return entries;
}
