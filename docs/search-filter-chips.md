# FilterChips: faixa compacta de busca

Status: implementado. Atualizado em 29/10/2026.

`src/features/search/components/client/FilterChips/FilterChips.tsx` reutiliza os botões e o tema Quintal para os filtros rápidos. A composição existente `SearchFilterBar` os apresenta na home com busca ativa; não há outro componente de chips, provider ou estado paralelo.

Interface: `query: SearchQuery`, `pets?: SearchPet[]` (padrão vazio), `onChange(query: SearchQuery): void`. O consumidor continua responsável pela URL e pela consulta. Exemplo: `<FilterChips query={query} pets={pets} onChange={update} />`.

## Responsividade e limites

Abaixo de `md` (900px no tema atual), os botões têm altura fixa de 44px, texto de 13px/20px, padding horizontal de 12px e distância de 6px. A altura preserva o alvo de toque enquanto reduz o texto e a largura visual; o alinhamento central impede que outros botões estiquem as pílulas. A partir de `md`, permanecem o texto de 14px, padding horizontal de 16px e altura mínima anterior de 40px (40,5px medidos com a linha e as bordas atuais). O botão de limpar acompanha a geometria da faixa.

A faixa não quebra linha, mantém rolagem horizontal local e não deve alargar a página. Rótulos permanecem completos, com seleção indicada por `aria-pressed`, marca visual e fundo grama. Os filtros e a ação de limpar preservam as regras anteriores; limpar mantém lugar, datas e pets. Não altera API, cache, permissões ou regras de filtragem. Dependências: MUI Button/Stack, tema Quintal, tokens de raio e textos de `searchCopy`.

## Validação

- Componente/funcional e integração: `npx vitest run src/features/search/components/client/FilterChips/FilterChips.test.tsx src/features/search/components/client/SearchFilterBar/SearchFilterBar.test.tsx src/features/search/components/client/SearchResults/SearchResults.int.test.tsx --testTimeout=15000`: **12 testes aprovados**. Cobrem alternância, seleção dos pets, preservação dos parâmetros, URL e atualização dos resultados. A primeira execução com limite padrão de 5s expirou em uma integração; a repetição com 15s passou, sem modificar os testes existentes.
- Navegador do componente real: harness local privado com esbuild, Chromium/Playwright, ThemeProvider e fonte Atkinson do projeto; larguras 360, 390, 768 e 1440px. Altura móvel de 44px, largura de 133,5px para “Casa com quintal”, texto de 13px, rolagem local e nenhum overflow da página; seleção de “Apartamento” aprovada nas quatro larguras. Desktop manteve 40,5px/14px. Essa verificação isolada não representa uma jornada Next completa nem integração com a API real.
- Regressão E2E em `e2e/mocked/home/search.spec.ts`, caso “chips compactos preservam toque, rolagem e selecao no celular”: **2 casos aprovados**, desktop e mobile, pelo agente principal em cópia Next isolada com backend simulado. Cobrem geometria responsiva, ausência de overflow da página, rolagem local no celular, seleção e preservação dos filtros na URL. A tentativa inicial na pasta original foi bloqueada por outro Next já ativo na porta 3000; esse servidor foi preservado. Esta execução valida a jornada Next com API simulada, não integração com backend real.
- Comando dessa execução na cópia privada `.agent-tools/upload-e2e-site`: `node node_modules/@playwright/test/cli.js test e2e/mocked/account/profile.spec.ts e2e/mocked/home/search.spec.ts --project=mocked-desktop --project=mocked-mobile --grep 'REQ-ACC-014/015/016|chips compactos' --reporter=list`. Para os chips, fonte idêntica à entrega; configuração privada usa portas 3180/5199 e Next dev com `--webpack`. Evidência local: `.agent-tools/upload-e2e.log`. Os dois casos de chips passaram nessa execução; testes de avatar pertencem à entrega de upload.
- ESLint dos dois arquivos alterados aprovado; Prettier aplicado.
- Unitário separado: N/A, sem nova função pura ou regra de domínio. Backend/HTTP real: N/A para esta alteração de apresentação; contratos e serviços não foram alterados.

Story existente de prévia: `FilterChips.stories.tsx`, incluindo `Celular`, `Ativos` e `ComPet`; props e contratos preservados, sem nova story duplicada.
