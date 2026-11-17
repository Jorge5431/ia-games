import Link from 'next/link';

const links={
  developer:[
    ['/developer/dashboard','Painel'],['/developer/games','Meus jogos'],['/developer/games/new','Cadastrar jogo'],
    ['/developer/submissions','Envios'],['/developer/analytics','Avaliações'],
  ],
  admin:[
    ['/admin','Visão geral'],['/admin/users','Usuários'],['/admin/developers','Desenvolvedores'],
    ['/admin/games','Jogos'],['/admin/moderation','Moderação'],['/admin/reports','Relatórios'],['/admin/settings','Configurações'],
  ],
} as const;

export function PortalShell({kind,title,children}: {kind:keyof typeof links;title:string;children:React.ReactNode}) {
  return <section className="container page"><h1>{title}</h1><div className="dashboard">
    <nav className="sidebar" aria-label={kind==='admin'?'Administração':'Portal do desenvolvedor'}>
      {links[kind].map(([href,label])=><Link href={href} key={href}>{label}</Link>)}
      <Link href="/account">Minha conta</Link>
    </nav>
    <div className="page-section">{children}</div>
  </div></section>;
}

export function Metrics({items}:{items:readonly (readonly [string,number])[]}) {
  return <div className="metrics">{items.map(([label,value])=><div className="panel" key={label}><p className="metric">{value.toLocaleString('pt-BR')}</p><p className="muted">{label}</p></div>)}</div>;
}
