import Link from 'next/link';
import { PortalShell, Metrics } from '@/components/portal-shell';
import { developerGames } from '@/lib/portal-data';
import { gameStatuses } from '@/lib/rules';

export const metadata={title:'Painel do desenvolvedor'};

export default async function Page() {
  const {games}=await developerGames('/developer/dashboard');
  const stats=Object.entries(gameStatuses).map(([status,label])=>[label,games.filter(game=>game.status===status).length] as const);
  return <PortalShell kind="developer" title="Painel do desenvolvedor"><Metrics items={stats}/>
    <div className="toolbar"><Link className="button" href="/developer/games/new">Cadastrar jogo</Link><Link className="button secondary" href="/developer/games">Meus jogos</Link></div>
  </PortalShell>;
}
