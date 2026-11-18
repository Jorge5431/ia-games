import { FallingText } from '@/components/falling-text';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { catalog, filters } from '@/lib/catalog';
import { Hero } from '@/components/hero';
import { Button } from '@/components/ui/button';
import { Categories, GameGrid, emptyCatalogMessage } from '@/components/catalog-view';


export default async function Home({searchParams}:{searchParams:Promise<{code?:string}>}) {
  const params=await searchParams;
  if(params.code) redirect('/auth/callback?'+new URLSearchParams({code:params.code}));
  const [recent,top,free,paid,popular]=await Promise.all([
    catalog(filters({}),8),catalog(filters({order:'rating',rating:'1'}),4),
    catalog(filters({price:'free'}),4),catalog(filters({price:'paid'}),4),
    catalog(filters({order:'popular',rating:'1'}),4),
  ]);
  const recommendations = recent.games.filter(game=>!top.games.some(ranked=>ranked.id===game.id)).slice(4,8);
  const shelves=[
    ['Lançamentos recentes','/store',recent.games],
    ['Populares por número de avaliações','/store?order=popular&rating=1',popular.games],
    ['Melhores avaliações','/store?order=rating&rating=1',top.games],
    ['Jogos gratuitos','/store?price=free',free.games],
    ['Jogos pagos','/store?price=paid',paid.games],
    ['Jogos para descobrir','/discover',recommendations],
  ] as const;
  return <div className="home immersive-home">
    <Hero/>
    <div id="home-catalog" className="cinematic-catalog">
    {recent.offline ? <section className="cinematic-empty"><h2><FallingText text="Catálogo indisponível"/></h2><p>Tente novamente em instantes.</p></section> : !recent.count ? <section className="cinematic-empty"><p className="eyebrow">Em breve</p><h2><FallingText text="Novos universos estão chegando"/></h2><p>{emptyCatalogMessage}</p></section> :
      shelves.map(([title,href,games])=>games.length>0 && <section className="page-section" key={title}>
        <div className="section-title"><h2><FallingText text={title}/></h2><Link className="text-link" href={href}>Ver todos</Link></div><GameGrid games={games} tilt={href==='/store'}/>
      </section>)}
    <section className="page-section"><h2><FallingText text={"Explore por categoria"}/></h2><Categories/></section>
    <section className="cinematic-developer"><h2><FallingText text={"Cria jogos com IA?"}/></h2><p className="muted">Solicite acesso ao portal para preparar seu jogo e enviá-lo para análise.</p><div><Button asChild variant="secondary"><Link href="/developer/apply">Tornar-se desenvolvedor<ArrowRight size={17}/></Link></Button></div></section>
    </div>
  </div>;
}
