import { CatalogView } from '@/components/catalog-view';
import type { Query } from '@/lib/catalog';

export const metadata={title:'Loja'};

export default async function Page({searchParams}:{searchParams:Promise<Query>}) {
  return <CatalogView title="Loja" params={await searchParams} path="/store"/>;
}
