import Link from 'next/link';
import { GameForm } from '@/components/game-form';
import { PortalShell } from '@/components/portal-shell';
import { requireRole } from '@/lib/supabase';

export const metadata={title:'Cadastrar jogo'};

export default async function Page() {
  await requireRole('developer','/developer/games/new');
  return <PortalShell kind="developer" title="Cadastrar jogo"><GameForm/><div><Link className="button secondary" href="/developer/games">Cancelar</Link></div></PortalShell>;
}
