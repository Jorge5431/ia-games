# VORNELIX 2.0

Marketplace de jogos desenvolvidos com inteligência artificial. A aplicação usa Next.js App Router, TypeScript estrito, Tailwind CSS, shadcn/ui, Motion for React e Supabase Auth, PostgreSQL e Storage.

## Iniciar

Requisitos locais: Node.js 22 ou superior e npm. Use Node.js 24 para coincidir com o CI.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Preencha `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com a chave **publishable** do painel Supabase e ajuste `SITE_URL`. A aplicação usa a chave publishable mesmo em ações autenticadas no servidor. Dados de conta e operações privilegiadas dependem da sessão e das permissões de banco. A URL de desenvolvimento é [http://localhost:3000](http://localhost:3000).

## Verificação

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

O conjunto padrão de navegador não exige conta ou dados. Os testes de banco executam PostgreSQL via PGlite com o snapshot estrutural e a migrations incrementais. Para testar Auth, correio, Storage e Data API em conjunto, use [o ambiente isolado](docs/deploy.md#teste-integrado-isolado).

- [Implantação, autenticação e primeiro jogo](docs/deploy.md)
- [Segurança](docs/security.md)
- [Verificação e auditoria de controles](docs/verification.md)

Pagamentos reais, upload de executáveis e distribuição real de arquivos começam desativados.
