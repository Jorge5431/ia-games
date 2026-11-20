# Segurança da Vornelix 2.0

- O servidor verifica a sessão com Supabase Auth e a função do usuário em `profiles` antes das páginas e mutações administrativas.
- O trigger de cadastro ignora papéis informados no metadata e grava sempre `player`. O banco limita as colunas editáveis de perfil, jogo e avaliação.
- Jogadores consultam somente seu perfil. O catálogo expõe o nome do desenvolvedor de um jogo publicado por função dedicada. As notas privadas de solicitação ficam fora das permissões de leitura do Data API e as notas de jogos passam pela regra de moderador ou proprietário.
- RLS restringe biblioteca, favoritos, avaliações, versões e operações de desenvolvedor. As views de catálogo e notas agregadas usam `security_invoker`. Aprovação de jogo, aprovação de desenvolvedor e reivindicação de gratuitos usam RPCs com verificação de identidade ou papel no banco.
- Imagens passam por limite de tamanho, lista de MIME e validação de assinatura de formato no servidor. Storage limita uploads às pastas do usuário. `game-builds` é privado e tem zero políticas públicas para objetos.
- A aplicação valida redirecionamentos, texto e URLs. Comentários são renderizados como texto escapado. Cabeçalhos restringem framing, MIME sniffing e objetos embutidos.
- As implementações privilegiadas de workflow ficam no schema privado. Wrappers públicos usam `SECURITY INVOKER` e só podem ser executados pelo papel autenticado. O Supabase Advisor retornou um aviso sobre a proteção de senhas vazadas desativada no Auth.
- O teste de autorização reproduz as permissões em base isolada. O pipeline com Supabase local cobre o comportamento da API, sessão, e-mail e Storage.
