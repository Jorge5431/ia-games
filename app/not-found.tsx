import Link from 'next/link';

export default function NotFound() {
  return <section className="container page"><p className="eyebrow">Erro 404</p><h1>Página não encontrada</h1><div><Link className="button" href="/store">Ir para a loja</Link></div></section>;
}
