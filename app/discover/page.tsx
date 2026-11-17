import { CatalogView } from '@/components/catalog-view';
import type { Query } from '@/lib/catalog';

export const metadata={title:'Descobrir jogos'};

export default async function Page({searchParams}:{searchParams:Promise<Query>}) {
  return <CatalogView title="Descobrir jogos" params={await searchParams} path="/discover"/>;
}
