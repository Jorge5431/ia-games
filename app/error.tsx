'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ErrorPage({reset}: {reset:()=>void}) {
  return <section className="container page"><h1>Esta página está indisponível</h1><p>Ocorreu um erro ao carregar o conteúdo.</p>
    <div className="toolbar"><Button onClick={()=>reset()}>Tentar novamente</Button><Link className="button secondary" href="/">Voltar ao início</Link></div>
  </section>;
}
