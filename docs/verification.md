# Verificação da Vornelix 2.0

## Resultados verificados

| Verificação | Resultado |
| --- | --- |
| `npm ci`, lint, TypeScript estrito e build de produção | Aprovados |
| Regras de URL, senhas, compra, download e avaliações | 11 testes unitários aprovados |
| PostgreSQL isolado | 8 testes aprovados para trigger de perfil, papéis, RLS, Storage, publicação, avaliações, favoritos, aquisição e versões |
| Playwright em Chromium headless | 11 testes aprovados para rotas, filtros, retorno após login, 404, menu, teclado, movimento reduzido, cinco tamanhos de tela e medição de renderização da home |
| Dependências | `npm audit` encontrou zero vulnerabilidades |
| Supabase hospedado | Duas migrations aplicadas e consultadas. Catálogo com zero jogos publicados e um perfil preexistente. Bucket de builds privado e sem políticas de objetos |
| Auth hospedado | Cadastro por e-mail habilitado com confirmação obrigatória. Entrega SMTP e recuperação pendentes de validação em um site implantado |
| Integração com Supabase local | Dois testes integrados Playwright com Auth, SMTP capturado, Data API e Storage foram incluídos. A execução local requer Docker, indisponível neste ambiente. Consulte os resultados de Actions no PR |

A suíte Chromium testou desktop e emulação de dispositivos móveis. Esses resultados não medem desempenho de campo em Android ou iPhone. Os 60 FPS e Core Web Vitals de campo dependem de dados reais e de dispositivos físicos.

## Controles e estados

| Controle | Ação e evidência |
| --- | --- |
| Entrar, cadastrar, confirmar cadastro, sair, recuperar senha, redefinir senha | Formulários e callback conectados ao Supabase Auth. Rotas, redirecionamento e link inválido passaram no Chromium. O trigger e a atribuição player passaram no banco. O fluxo com e-mail e credenciais depende da suíte de integração |
| Pesquisar, explorar, categorias, filtrar, ordenar, limpar, paginar | Navegação, envio de filtros e retorno testados no Chromium. Catálogo com exclusão de rascunhos e ordenação de avaliações verificado em PostgreSQL |
| Anterior, próximo, pausar e selecionar banner, galeria e teclado | Aparecem quando há mídia real publicada. O banner institucional respeitou movimento reduzido no Chromium. Controles de slides e galeria com várias mídias exigem catálogo de teste e não foram exercitados no ambiente local |
| Detalhes e compartilhar | Detalhes usam o slug público. Compartilhamento usa a API do navegador ou a área de transferência. A página 404 passou no Chromium |
| Comprar, adicionar à biblioteca, download | Checkout exige sessão e preço de produto publicado. Aquisição gratuita e proibição de adquirir jogos pagos verificadas no banco. Decisões de propriedade, revisão do arquivo e indisponibilidade verificadas em testes unitários |
| Adicionar e remover favoritos | RLS e persistência verificadas com perfis distintos no banco. Interação autenticada coberta pela suíte de integração |
| Minha conta, editar, salvar perfil e enviar avatar | Rotas protegidas verificadas no Chromium. Armazenamento por pasta e proibição de trocar o próprio papel verificadas no banco. Upload de avatar e persistência no navegador cobertos pela suíte de integração |
| Avaliar, editar e excluir avaliação | Propriedade exigida e operações verificadas no banco. Interação autenticada coberta pela suíte de integração |
| Tornar-se desenvolvedor, cadastrar jogo, salvar rascunho, enviar imagens, enviar para análise, aprovar e rejeitar | Regras de papel, rejeição, reenvio, publicação e privacidade verificadas no banco. Cadastro, upload e moderação via navegador cobertos pela suíte de integração |
| Cancelar, voltar e abrir ou fechar o menu mobile | Rotas de retorno implementadas. Menu mobile testado por touch e Escape. Os fluxos atuais usam páginas e controles embutidos |
| Carregamento e cliques duplicados | Formulários bloqueiam controles enquanto a ação está em andamento. Aquisição gratuita é idempotente no banco e passou em dois envios |

O ambiente hospedado não recebeu jogadores nem jogos de teste. Para reproduzir os testes integrados com fixtures, siga [o guia de implantação](deploy.md#teste-integrado-isolado).
