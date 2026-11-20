import { CatalogView } from '@/components/catalog-view';
import type { Query } from '@/lib/catalog';

export const metadata={title:'Pesquisar jogos'};

export default async function Page({searchParams}:{searchParams:Promise<Query>}) {
  return <CatalogView title="Pesquisar jogos" params={await searchParams} path="/search"/>;
}
