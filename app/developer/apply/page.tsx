import Link from 'next/link';
import { session, roleOf } from '@/lib/supabase';
import { applyDeveloper } from '@/lib/player-actions';
import { ActionForm, Field, Notes } from '@/components/action-form';
import { FallingText } from '@/components/falling-text';
import { Button } from '@/components/ui/button';

export const metadata={title:'Publique seu jogo'};
const labels={pending:'Em análise',approved:'Aprovada',rejected:'Rejeitada'};

export default async function Page() {
  const current=await session();
  const role=current?await roleOf():null;
  const result=current?await current.client.from('developer_applications').select('studio_name,status').eq('user_id',current.user.id).maybeSingle():null;
  const data=result?.data;
  return <section className="container page creator-apply">
    <header><p className="eyebrow">VORNELIX · PARA CRIADORES</p><h1><FallingText text="Seu jogo começa aqui"/></h1><p>Você pode solicitar acesso mesmo sendo um desenvolvedor independente ou iniciante. Não precisa ter um estúdio formal.</p></header>
    <ol className="creator-steps"><li><strong>1. Solicite acesso</strong><p>Conte um pouco sobre você e como usa IA.</p></li><li><strong>2. Aguarde a análise</strong><p>Acompanhe o status nesta página.</p></li><li><strong>3. Prepare seu jogo</strong><p>Após aprovação, cadastre as informações e mídias no portal.</p></li></ol>
    <div className="creator-application-form">
    {result?.error?<p role="alert">Não foi possível consultar sua solicitação. Tente novamente.</p>:role==='developer'||role==='admin'?<><h2>Seu acesso está disponível</h2><Button asChild><Link href="/developer/dashboard">Abrir portal</Link></Button></>:data?<><h2>Sua solicitação</h2><p>{data.studio_name} · {labels[data.status as keyof typeof labels]}</p><p>Consulte esta página para acompanhar a decisão.</p></>:!current?<><h2>Comece com sua conta</h2><p>Entre ou crie uma conta para enviar sua solicitação. Você ainda não precisa enviar arquivos do jogo.</p><Button asChild><Link href="/login?next=%2Fdeveloper%2Fapply">Entrar ou criar conta</Link></Button></>:<>
      <h2>Solicitar acesso de desenvolvedor</h2><p>Preencha os dois campos obrigatórios. O portfólio é opcional.</p>
      <ActionForm action={applyDeveloper} label="Enviar solicitação para análise">
        <Field name="studio_name" label="Seu nome ou nome do estúdio" placeholder="Ex.: Meu nome ou Indie Studio" min={2} max={80} required/>
        <p className="muted">Conte quais ferramentas de IA usa e que tipo de jogo está criando. Escreva pelo menos 10 caracteres.</p>
        <Notes name="description" label="Conte sobre seu projeto e uso de IA" required/>
        <Field name="portfolio_url" label="Link do portfólio (opcional)" placeholder="https://..." type="url" max={500}/>
      </ActionForm>
    </>}
    </div>
  </section>;
}
