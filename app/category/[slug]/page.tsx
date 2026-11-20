import { notFound } from 'next/navigation';
import { CatalogView } from '@/components/catalog-view';
import type { Query } from '@/lib/catalog';
import { categories } from '@/lib/rules';

type Props={params:Promise<{slug:string}>;searchParams:Promise<Query>};

export async function generateMetadata({params}:Props) {
  const {slug}=await params;
  return {title:categories.find(([key])=>key===slug)?.[1]||'Categoria'};
}

export default async function Page({params,searchParams}:Props) {
  const {slug}=await params;
  const category=categories.find(([key])=>key===slug);
  if(!category) notFound();
  return <CatalogView title={category[1]} params={await searchParams} categorySlug={slug} path={'/category/'+slug}/>;
}
