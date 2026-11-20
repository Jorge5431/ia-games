import 'server-only';

import { db } from './supabase';
import { categories, platforms } from './rules';

export const gameFields = 'id,developer_id,title,slug,short_description,description,genre,price,cover_url,banner_url,platform,languages,release_date,status,created_at,updated_at,reviewed_at';
export const gameDetailsFields = gameFields + ',hero_media,minimum_requirements,recommended_requirements,ai_disclosure';

export type Game = {
  id:string; developer_id:string; title:string; slug:string|null; short_description:string|null; description:string|null;
  genre:string|null; price:number; cover_url:string|null; banner_url:string|null; platform:string[]|null; languages:string[]|null;
  release_date:string|null; created_at:string; updated_at:string; status:'draft'|'pending'|'published'|'rejected';
  hero_media?:'trailer'|'banner'; minimum_requirements?:string|null; recommended_requirements?:string|null; ai_disclosure?:string|null;
  rating_average?:number|null; review_count?:number;
};
export type Media = {id:string;media_url:string;media_type:'screenshot'|'trailer';position:number};
export type Query = Record<string,string|string[]|undefined>;

export const PAGE_SIZE = 24;
export const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export function filters(params: Query) {
  const raw = first(params.q)?.trim().slice(0,80) ?? '';
  const category = categories.find(([slug]) => slug === first(params.genre));
  const requestedPlatform = first(params.platform);
  const platform = platforms.find(value => value === requestedPlatform);
  const price = first(params.price);
  const order = first(params.order);
  const rating = Number(first(params.rating));
  const page = Math.min(10000, Math.max(1, Number.parseInt(first(params.page) || '1',10) || 1));
  return {q:raw, category, platform, price, order, rating:Number.isInteger(rating)&&rating>=1&&rating<=5 ? rating : null, page};
}

export async function catalog(query: ReturnType<typeof filters>, limit = PAGE_SIZE) {
  const client = await db();
  if (!client) return { games:[] as Game[], count:0, offline:true };
  let results = client.from('published_games_catalog').select(gameFields+',rating_average,review_count',{count:'exact'});
  const search = query.q.replace(/[\\%_(),.*]/g,' ').trim().replace(/\s+/g,' ');
  if (search) results = results.ilike('search_text', '%'+search+'%');
  if (query.category) results = results.eq('genre',query.category[1]);
  if (query.platform) results = results.contains('platform',[query.platform]);
  if (query.price === 'free') results = results.eq('price',0);
  if (query.price === 'paid') results = results.gt('price',0);
  if (query.rating) results = results.gte('rating_average',query.rating);
  if (query.order === 'price-asc' || query.order === 'price-desc') results = results.order('price',{ascending:query.order === 'price-asc'});
  if (query.order === 'rating') results = results.order('rating_average',{ascending:false,nullsFirst:false});
  if (query.order === 'popular') results = results.order('review_count',{ascending:false});
  results = results.order('release_date',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false}).order('id');
  const start = (query.page-1)*limit;
  const {data,error,count} = await results.range(start,start+limit-1);
  if (error) {
    console.error('Catálogo indisponível',error.code);
    return {games:[] as Game[],count:0,offline:true};
  }
  return {games:(data || []) as unknown as Game[],count:count ?? 0,offline:false};
}

export async function publishedGame(column:'slug'|'id', value:string) {
  const client = await db();
  if (!client) return null;
  const {data,error} = await client.from('games').select(gameDetailsFields).eq(column,value).eq('status','published').maybeSingle();
  if (error) throw new Error('Não foi possível carregar o jogo.');
  return data as unknown as Game|null;
}

export function publicImage(url: string|null|undefined, bucket = 'game-images') {
  const backend = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !backend) return null;
  try {
    const candidate = new URL(url);
    const storage = new URL(backend);
    return candidate.origin === storage.origin && candidate.pathname.startsWith('/storage/v1/object/public/'+bucket+'/')
      && !candidate.username && !candidate.password ? candidate.href : null;
  } catch {
    return null;
  }
}

export function isDirectVideoUrl(value:string|null|undefined):value is string {
  if(!value) return false;
  try {
    const url=new URL(value);
    return url.protocol==='https:'&&!url.username&&!url.password&&/\.(mp4|webm)$/i.test(url.pathname);
  } catch {
    return false;
  }
}
