import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { catalog, filters, publicImage } from '@/lib/catalog';
import { Hero, type Slide } from '@/components/hero';
import { Button } from '@/components/ui/button';
import { Categories, Empty, GameGrid, emptyCatalogMessage } from '@/components/catalog-view';

const institutional: Slide = {title:'Gaming Reimagined',summary:'Uma nova loja para descobrir jogos criados com inteligência artificial.',href:'/store',image:null};

export default async function Home({searchParams}:{searchParams:Promise<{code?:string}>}) {
  const params=await searchParams;
  if(params.code) redirect('/auth/callback?'+new URLSearchParams({code:params.code}));
  const [recent,top,free,paid,popular]=await Promise.all([
    catalog(filters({}),8),catalog(filters({order:'rating',rating:'1'}),4),
    catalog(filters({price:'free'}),4),catalog(filters({price:'paid'}),4),
    catalog(filters({order:'popular',rating:'1'}),4),
  ]);
  const featured=recent.games.filter(game=>game.slug && publicImage(game.banner_url || game.cover_url)).slice(0,4);
  const slides:Slide[]=[institutional,...featured.map(game=>({
    title:game.title,summary:game.short_description||'',href:'/game/'+encodeURIComponent(game.slug!),image:publicImage(game.banner_url||game.cover_url),
  }))];
  const recommendations = recent.games.filter(game=>!top.games.some(ranked=>ranked.id===game.id)).slice(4,8);
  const shelves=[
    ['Lançamentos recentes','/store',recent.games],
    ['Populares por número de avaliações','/store?order=popular&rating=1',popular.games],
    ['Melhores avaliações','/store?order=rating&rating=1',top.games],
    ['Jogos gratuitos','/store?price=free',free.games],
    ['Jogos pagos','/store?price=paid',paid.games],
    ['Jogos para descobrir','/discover',recommendations],
  ] as const;
  return <div className="container home">
    <Hero slides={slides}/>
    {recent.offline ? <Empty title="Catálogo indisponível">Tente novamente em instantes.</Empty> : !recent.count ? <Empty title="O catálogo estreia em breve">{emptyCatalogMessage}</Empty> :
      shelves.map(([title,href,games])=>games.length>0 && <section className="page-section" key={title}>
        <div className="section-title"><h2>{title}</h2><Link className="text-link" href={href}>Ver todos</Link></div><GameGrid games={games} tilt={href==='/store'}/>
      </section>)}
    <section className="page-section"><h2>Explore por categoria</h2><Categories/></section>
    <section className="panel"><h2>Cria jogos com IA?</h2><p className="muted">Solicite acesso ao portal para preparar seu jogo e enviá-lo para análise.</p><div><Button asChild variant="secondary"><Link href="/developer/apply">Tornar-se desenvolvedor<ArrowRight size={17}/></Link></Button></div></section>
  </div>;
}
