# Preferências, confirmação e profundidade visual

- `/settings` abre preferências sem exigir login. A área `/account/settings` também contém os controles.
- Tema claro, escuro ou do sistema; texto padrão/ampliado; contraste padrão/alto; densidade confortável/compacta; reprodução automática de banners; movimento imersivo/reduzido.
- Preferências persistem por um cookie validado com Zod, sem dados pessoais, por um ano neste navegador. São renderizadas no servidor para evitar mudança de tema durante hidratação. Não há sincronização entre dispositivos.
- Português, inglês e espanhol aplicam-se à navegação principal, preferências e confirmação. Demais formulários, páginas e conteúdo do catálogo permanecem em português. A interface informa esse escopo; tradução integral é pendente.
- As camadas decorativas usam transformações vinculadas ao scroll, não capturam cliques e ficam atrás da arte institucional. Na galeria aparecem nas margens da imagem. Movimento reduzido do sistema e do usuário desabilita esses efeitos; em telas pequenas o parallax é estático.
- `/auth/callback` apresenta `/auth/confirmed` após verificação bem-sucedida. Recuperação de senha continua seguindo para `/reset-password`. A página só afirma “E-mail confirmado” se uma sessão validada tiver `email_confirmed_at`.
- A home encaminha `?code=...` ao callback quando o Supabase retorna para a raiz do domínio correto.

## Limite do redirecionamento

Código hospedado não pode interceptar `http://localhost:3000` no dispositivo do usuário. Os e-mails antigos com esse destino não são corrigidos retroativamente. No projeto Supabase `kcamqntaofezflixmfoa`, Site URL e Redirect URLs precisam apontar ao domínio Vercel válido. Preserve confirmação obrigatória. Não copie códigos de autenticação para logs ou documentação.

## Validação

Testes adicionados para cookie inválido, persistência de preferências após recarga, idioma da navegação, reset, proteção contra falsa confirmação e parallax com movimento reduzido. A suíte integrada de e-mail isolado exige a nova página e o botão de continuação antes de testar persistência da sessão. Nenhuma conta de produção foi criada para esses testes.

## Auditoria de dependências — 17/11/2026

- `npm audit --omit=dev --json`: 0 vulnerabilidades reportadas.
- `npm audit --json`: 16 ocorrências high na cadeia de ferramentas de desenvolvimento (ESLint/Vitest/Vite), propagadas de picomatch.
- Advisory GHSA-fc5q-39xc-vjpf: ReDoS por padrões extglob fornecidos pelo atacante; versões até 4.0.7 afetadas e nenhuma versão corrigida indicada na consulta de 17/11/2026. Fonte: https://github.com/advisories/GHSA-fc5q-39xc-vjpf
- Não aplicar downgrade automático de Next/Vitest nem declarar auditoria integralmente limpa. Aguardar correção compatível e repetir auditoria/testes. Os glob patterns da aplicação não são fornecidos por usuários do marketplace; isso não elimina o alerta nas ferramentas.
- CI anterior passou lint, typecheck, 21 testes unitários/banco, build e os testes integrados de autenticação em Supabase isolado. A asserção de movimento reduzido foi refinada para verificar matriz identidade antes e depois de rolar: Chrome pode serializar a transformação neutra como matriz em vez de `none`. O resultado final deve ser consultado no workflow associado ao commit.
