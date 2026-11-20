import Link from 'next/link';

export const metadata={title:'Sobre a Vornelix'};

export default function Page() {
  return <section className="container page"><h1>Sobre a Vornelix</h1><div className="panel">
    <p>A Vornelix reúne jogos desenvolvidos com apoio de inteligência artificial. Cada desenvolvedor descreve o uso de IA para que você possa conhecer o processo por trás do jogo.</p>
    <div className="toolbar"><Link className="button" href="/store">Explorar loja</Link><Link className="button secondary" href="/developer/apply">Tornar-se desenvolvedor</Link></div>
  </div></section>;
}
