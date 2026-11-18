import { ActionForm } from '@/components/action-form';
import { unpublishGame } from '@/lib/portal-actions';
import Link from 'next/link';
import { PortalShell } from '@/components/portal-shell';
import { developerGames } from '@/lib/portal-data';
import { gameStatuses } from '@/lib/rules';

export const metadata={title:'Meus jogos'};

export default async function Page() {
  const {games}=await developerGames('/developer/games');
  return <PortalShell kind="developer" title="Meus jogos"><div><Link className="button" href="/developer/games/new">Cadastrar jogo</Link></div>
    <div className="panel">{games.length?games.map(game=><div className="row" key={game.id}>
      <div><h3>{game.title}</h3><span className="pill">{gameStatuses[game.status]}</span></div>
      <Link className="button secondary" href={'/developer/games/'+game.id+'/edit'}>{['draft','rejected'].includes(game.status)?'Editar':'Ver jogo'}</Link>
      {game.status==='published'&&<details><summary className="text-link">Remover do catálogo</summary><ActionForm action={unpublishGame.bind(null,game.id)} label="Confirmar remoção" secondary><label><input type="checkbox" name="confirm" value="yes" required/> Confirmo que o jogo ficará indisponível na loja.</label></ActionForm></details>}
    </div>):<p>Você ainda não cadastrou jogos.</p>}</div>
  </PortalShell>;
}
