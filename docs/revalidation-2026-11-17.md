# Revalidação — 17/11/2026

Base auditada: `2417443964727d01d5d32abf414fd9bd425dd5d9`.

A reconstrução já estava implementada na branch `rebuild/vornelix-v2`, com PR #1 aberto. Esta revisão preservou o código e criou a branch `backup/vornelix-v2-2417443` no mesmo commit. Não houve merge na main, alteração de dados de produção ou aplicação de novas migrations nesta revisão.

## Evidências desta revisão

- Clone e `npm ci`: aprovados (443 pacotes instalados).
- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run test`: 19 testes aprovados em dois arquivos, incluindo PostgreSQL isolado via PGlite.
- `npm run build`: aprovado; 40 páginas estáticas geradas e rotas dinâmicas compiladas.
- `npm audit --json`: zero vulnerabilidades reportadas.
- GitHub Actions do commit auditado: execução 44077371814 concluída com sucesso; jobs `checks` e `supabase-integration` aprovados, incluindo Playwright e Supabase local. Os testes de navegador e de Auth/SMTP integrado não foram repetidos localmente nesta revisão; a evidência é o CI consultado diretamente.

## Supabase hospedado

Projeto confirmado: `kcamqntaofezflixmfoa` (Vornelix), ACTIVE_HEALTHY.

- Nove tabelas públicas listadas com RLS habilitado.
- Um perfil existente e zero jogos; nenhum fixture inserido em produção.
- Dez migrations registradas, incluindo `vornelix_storefront_contract` e `vornelix_private_workflow_rpcs`.
- Trigger `on_auth_user_created` chama `handle_new_user()`.
- Políticas de catálogo, propriedade, edição, avaliações e Storage consultadas. As políticas adicionais de publicação em favoritos e avaliações são RESTRICTIVE.
- Buckets `avatars` e `game-images` limitam formatos de imagem; `game-builds` é privado e não possui políticas de objetos que liberem executáveis.
- Advisor de segurança: um aviso de proteção contra senhas vazadas desativada. Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

A consulta estrutural não substitui testes de todas as permissões em produção. Não foram criadas contas nem enviados e-mails de teste no projeto hospedado.

## Bloqueio para aceite final

Não há implantação/preview verificado nesta revisão. O plugin Vercel foi localizado, mas não está instalado/conectado. É necessário disponibilizar a integração ou informar uma infraestrutura Next.js existente para implantar a branch, definir SITE_URL e callbacks e validar confirmação e recuperação de senha no ambiente hospedado. A entrega SMTP e o fluxo Auth de produção continuam pendentes. Nenhum domínio foi inventado e nenhuma proteção de Auth foi desativada.

Pagamentos reais, upload de executáveis e distribuição real continuam desativados em `lib/rules.ts`.

Consulte [verificação e checklist dos controles](verification.md), [segurança](security.md) e [execução e implantação](deploy.md). O projeto não é declarado concluído em produção enquanto esses bloqueios persistirem.
