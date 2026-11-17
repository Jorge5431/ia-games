import { PlayerCollection } from '@/components/player-collection';
import { first, type Query } from '@/lib/catalog';

export const metadata={title:'Biblioteca'};

export default async function Page({searchParams}: {searchParams:Promise<Query>}) {
  const params=await searchParams;
  return <PlayerCollection kind="library" search={first(params.q)?.slice(0,80)} genre={first(params.genre)}/>;
}
