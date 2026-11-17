import { PortalShell } from '@/components/portal-shell';
import { flags } from '@/lib/rules';
import { requireRole } from '@/lib/supabase';

export const metadata={title:'Configurações da plataforma'};

export default async function Page() {
  await requireRole('admin','/admin/settings');
  const options=[['Pagamentos reais',flags.realPayments],['Envio de executáveis',flags.executableUpload],['Distribuição de arquivos',flags.realFileDistribution]] as const;
  return <PortalShell kind="admin" title="Configurações da plataforma"><dl className="panel">
    {options.map(([label,active])=><div className="row" key={label}><dt>{label}</dt><dd className="pill">{active?'Ativo':'Desativado'}</dd></div>)}
  </dl></PortalShell>;
}
