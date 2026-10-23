# 076: iniciais e avatar humano compartilhado

Corrige `Ana Souza (teste)` de `A(` para `AS`. `initialsOf` aceita letras Unicode, normaliza NFC, ignora observações entre parênteses (inclusive aninhadas ou sem fechamento), partículas isoladas da/de/do/das/dos/e, números, pontuação e emoji. Primeiro e último nome útil fornecem as iniciais; uma palavra fornece uma; sem letras úteis usa `?`. Empresas seguem a mesma regra, inclusive siglas e sufixos legais, sem tentar deduzir razão social.

`src/shared/ui/media/InitialsAvatar/` centraliza foto opcional, fallback e cores; `src/shared/theme/tokens/semantic.ts` fornece `avatarTones`, publicado por `theme.palette.avatar`. Coral atenuado `#B6533A` com branco é a recomendação aprovada pelo coordenador para revisão de Renato (4,90:1). Alternativa café reutiliza texto2 `#5A4E45` (8,04:1). Critério 4,5:1 para texto pequeno, sem exceção de letra grande. Coral original+branco dá 3,03:1; clarear o mesmo coral não resolve o contraste.

Consumidores desta etapa: AccountMenu, PublicProfileCard, HostBookingList, AvatarUploader. Somente tamanho/geometria permanecem nos consumidores; foto, remoção, menu, requisições e nomes exibidos preservam seus contratos.

A migração dos avatares humanos de ListingCard e ListingPageScreen aguarda o merge da 070 e rebase da 076, por instrução do coordenador. Não alterar esses arquivos na base atual.

Validação enxuta, sem execução enquanto a máquina está na fila: unitários `initials.test.ts` para parsing; `contrast.test.ts` para AA; um funcional `InitialsAvatar.test.tsx` para erro de imagem e fallback; stories visuais de nomes/foto/falha/tamanhos e comparação. Sem novos E2E: a jornada e as ações do cabeçalho não mudaram. Sem nova integração HTTP: componente de apresentação sem transporte. Capturas do cabeçalho em 1440/390 aguardam vez de validação e comparação antes/depois. Lint e tsc finais também aguardam liberação.

Documentação canônica no vault: `development/resources/initials-avatar.md`.

Pontuação interna não divide nomes: A.C.M.E. gera A, Patas S.A. gera PS e João-Silva isolado gera J. Espaços separam as palavras úteis.
