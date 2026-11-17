import Link from 'next/link';

export const metadata={title:'Suporte'};

export default function Page() {
  return <section className="container page"><h1>Suporte</h1><div className="panel">
    <h2>Acesso à conta</h2><p className="muted">Se o e-mail de confirmação ou recuperação não chegou, confira a caixa de spam e a grafia do endereço.</p>
    <div className="toolbar"><Link className="button" href="/forgot-password">Recuperar senha</Link><Link className="button secondary" href="/login">Entrar</Link></div>
  </div><div className="panel"><h2>Jogos adquiridos</h2><p className="muted">Consulte a disponibilidade de cada jogo na área de downloads.</p>
    <div className="toolbar"><Link className="button secondary" href="/library">Abrir biblioteca</Link><Link className="button secondary" href="/downloads">Ver downloads</Link></div>
  </div></section>;
}
