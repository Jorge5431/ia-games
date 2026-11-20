import Link from 'next/link';

export const metadata={title:'Privacidade'};

export default function Page() {
  return <section className="container page"><h1>Privacidade</h1><article className="panel">
    <h2>Dados da conta</h2><p>A Vornelix usa e-mail e credenciais para autenticação via Supabase Auth. Cookies de sessão mantêm você conectado entre visitas.</p>
    <h2>Dados do perfil e da atividade</h2><p>Seu perfil, biblioteca, favoritos, avaliações e solicitações de desenvolvedor são registrados para prestar esses serviços. Comentários de avaliações e o nome de exibição de desenvolvedores de jogos publicados podem aparecer na loja.</p>
    <h2>Gerenciar seu perfil</h2><div><Link className="button secondary" href="/account/profile">Editar perfil</Link></div>
  </article></section>;
}
