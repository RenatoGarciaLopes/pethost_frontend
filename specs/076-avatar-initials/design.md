# 076: iniciais e avatar humano compartilhado

Corrige `Ana Souza (teste)` de `A(` para `AS`. `initialsOf` aceita letras Unicode, normaliza NFC, ignora observações entre parênteses (inclusive aninhadas ou sem fechamento), partículas isoladas da/de/do/das/dos/e, números, pontuação e emoji. Primeiro e último nome útil fornecem as iniciais; uma palavra fornece uma; sem letras úteis usa `?`. Empresas seguem a mesma regra, inclusive siglas e sufixos legais, sem tentar deduzir razão social.

`src/shared/ui/media/InitialsAvatar/` centraliza foto opcional, fallback e cores; `src/shared/theme/tokens/semantic.ts` fornece `avatarTones`, publicado por `theme.palette.avatar`. Coral atenuado `#B6533A` com branco é a recomendação aprovada pelo coordenador para revisão de Renato (4,90:1). Alternativa café reutiliza texto2 `#5A4E45` (8,04:1). Critério 4,5:1 para texto pequeno, sem exceção de letra grande. Coral original+branco dá 3,03:1; clarear o mesmo coral não resolve o contraste.

Consumidores: AccountMenu, PublicProfileCard, HostBookingList, AvatarUploader, ListingCard e ListingPageScreen (Quem cuida). Somente tamanho/geometria permanecem nos consumidores; foto, remoção, menu, requisições e nomes exibidos preservam seus contratos.

Merge de dev preserva a pílula responsiva de AccountMenu (32 px, primeiro nome somente no desktop) e os novos layouts de card e detalhe. ListingCard usa 28 px e Quem cuida 56 px, com bordas preservadas e sem cores locais. A função avatarColor foi removida junto de seu último uso.

Validação 23/10: tsc sem erros; eslint dos tocados sem avisos; 76 testes aprovados em 8 arquivos (initials, contrast, InitialsAvatar, AccountMenu, ListingCard, ListingPageScreen, AvatarUploader e HostBookingList). Regressões das três composições verificam AS sem alterar Ana Souza (teste) exibido. O teste de imagem simula o carregador Image usado pelo MUI. E2E e capturas em `e2e/mocked/avatar-initials.spec.ts` verificam cores computadas e navegação card → Quem cuida em 1440/390. Backend simulado, sem validação da API real; contrato HTTP não muda. Resultado final e limitações no vault. Captura anterior histórica indisponível nesta retomada.

Documentação canônica no vault: `development/resources/initials-avatar.md`.

Pontuação interna não divide nomes: A.C.M.E. gera A, Patas S.A. gera PS e João-Silva isolado gera J. Espaços separam as palavras úteis.

Validação visual final: dois testes Playwright aprovados (mocked-desktop/mobile, um worker, CI=1), seis PNGs conferidos em test-results/mocked-avatar-initials-076-9ba45-iniciais-brancas-e-coral-AA-mocked-{desktop,mobile}/. Cabeçalho/card/Quem cuida com coral e branco em 1440/390. Sem antes histórico e sem runner Storybook nesta rodada. Turbopack incompatível com junction; configuração temporária --webpack removida após uso. Após as aprovações, runner interrompido durante teardown para encerrar servidores e liberar 3100/5099 ao Loam. Detalhes e limitações no vault.
