import Link from 'next/link';

export default function ForbiddenPage() {
  return <section className="container page"><p className="eyebrow">Acesso restrito</p><h1>Você não tem permissão para acessar esta página</h1><div><Link className="button" href="/account">Minha conta</Link></div></section>;
}
