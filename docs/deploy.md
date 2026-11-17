# Implantação e operação

## Vercel

1. Importe o repositório em um projeto Vercel com o preset Next.js. Use a branch `rebuild/vornelix-v2` para revisão e preview.
2. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SITE_URL` em cada ambiente. `SITE_URL` deve ser a origem HTTPS exata do ambiente, sem caminho. Use uma instância Supabase isolada para previews que aceitem cadastros de teste.
3. No Auth do Supabase, configure o Site URL canônico e os callbacks aprovados, com os padrões estritamente necessários para query strings. Inclua `http://localhost:3000/auth/callback` no projeto de desenvolvimento.
4. Configure SMTP de produção, remetente e domínio verificados. Preserve a confirmação de e-mail. Use os modelos em `supabase/templates/` e confirme a entrega na caixa de destino. Esses modelos usam `SiteURL` e `TokenHash`, por isso cada instância de teste deve ter sua própria origem.
5. Execute os controles de CI. Para confirmar produção depois do deploy, peça ao responsável para criar ou indicar uma conta autorizada e valide confirmação, recuperação e logout antes de convidar usuários.

Variáveis de integração administrativa e testes pertencem apenas ao processo isolado de testes. Mantenha chaves administrativas fora do Vercel e da aplicação.

## Banco de dados

`supabase/migrations/*_hosted_schema_snapshot.sql` reconstrói o schema para o ambiente Supabase local. Ele substitui a cadeia histórica no bootstrap de testes e usa a origem local nas restrições de URL do Storage. `supabase/history/` guarda as oito migrations hospedadas anteriores como referência de auditoria. O arquivo `*_vornelix_storefront_contract.sql` é a migration incremental da Vornelix 2.0. Em instalações já existentes, compare o histórico hospedado e aplique exclusivamente as mudanças incrementais ausentes. As migrations `20261117111148_vornelix_storefront_contract` e `20261117111832_vornelix_private_workflow_rpcs` já foram aplicadas à Vornelix. A configuração local fixa PostgreSQL 17.

## Teste integrado isolado

Requer Docker e portas 3000, 54321, 54322 e 54324 livres.

```bash
npx supabase start
npx supabase status -o env
```

Use a URL local da API e a chave publishable local em `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Exporte a chave administrativa exclusivamente da instância local como `VORNELIX_TEST_SUPABASE_KEY`, além de `VORNELIX_TEST_SUPABASE=1` e `VORNELIX_LOCAL_TEST=1`. A suíte aceita somente URLs de backend de loopback.

```bash
npm run build
npm run test:e2e -- e2e/connected.spec.ts
npx supabase stop
```

Os e-mails de confirmação e recuperação ficam na caixa de testes local na porta 54324. As fixtures são descartáveis e usam endereços aleatórios no domínio reservado example.com.

## Criar o primeiro administrador

O proprietário cria e confirma a conta via Auth. No SQL Editor, identifique e confira o UUID da conta autorizada em **Authentication → Users**. Use uma transação com o UUID confirmado, confira a linha retornada e faça commit no mesmo comando apenas depois de validar o identificador.

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = '<UUID-autorizado>'::uuid and role = 'player'
returning id, role;
```

## Publicar o primeiro jogo

1. Entre como jogador e abra **Minha conta → Acesso de desenvolvedor**. Envie a solicitação.
2. Entre como administrador e aprove em **Administração → Desenvolvedores**.
3. No portal de desenvolvedor, salve o rascunho com endereço único, descrição e declaração de uso de IA. Em **Mídias**, envie capa, banner e capturas e cadastre um trailer HTTPS, se disponível.
4. Selecione **Enviar para análise**. Abra **Administração → Moderação** e registre a decisão.
5. Após aprovação, confira a página pública e o preço armazenado. A aquisição gratuita já usa a RPC transacional. O checkout pago informa a indisponibilidade financeira.

## Pagamentos futuros

A interface `PaymentProvider` em `lib/payments.ts` define sessão e validação de eventos. Antes de ativar o recurso, escolha o provedor e adicione pedidos e itens persistidos com preço em centavos, eventos com identificador único e recebimento idempotente. Valide assinatura, moeda, valor, conta e estado do pedido antes de gravar a aquisição de um jogo pago. Teste confirmação, cancelamento, reembolso e eventos fora de ordem em sandbox.

## Downloads futuros

A tabela de versões e o bucket privado `game-builds` fornecem a base do fluxo. Antes de ativar a distribuição, implemente quarentena privada, cálculo e registro de SHA-256, scanner antimalware, análise estática, execução em sandbox isolada, decisão administrativa e revogação. Aplique uma política de Storage que permita assinatura apenas para proprietário, jogo publicado e versão aprovada. O servidor já exige publicação, propriedade, estado aprovado e a flag de distribuição antes de solicitar URL por 60 segundos. O armazenamento de executáveis permanece bloqueado no estado inicial.
