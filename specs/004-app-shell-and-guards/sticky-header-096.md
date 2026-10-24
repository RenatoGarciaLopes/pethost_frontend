# 096: cabeçalho fixo

Status: implementado na worktree `pethost_frontend-096`, branch `feat/096-sticky-header`, E2E e prints delegados pelo coordenador à validação externa em 24/10/2026.

## Recursos e comportamento

- `src/widgets/app-shell/components/AppHeader.tsx`: mesma interface (`user`, `variant`, `search`, `filters`, `returnTo`), agora client para medir seu elemento com `ResizeObserver`. `position: sticky`, `top: 0`, `theme.zIndex.appBar`, fundo opaco `account.*` e borda existente. Mantém espaço no fluxo; não precisa de spacer. Um `useLayoutEffect` publica a altura completa em `document.documentElement.style.--app-header-height` antes do paint da hidratação; o observer acompanha fontes, wrapping, chips e viewport. Cleanup desconecta e remove o valor inline. Uma única instância por documento. Não há listener de scroll, animação ou sombra adicional.
- `src/shared/theme/overrides/CssBaseline.ts`: valor inicial SSR de `--app-header-height` (80px desktop, 74px abaixo de md), substituído pela medida real após hidratação; âncoras `#conteudo` e `#como-funciona` usam `scroll-margin-top` com altura mais 16px. O valor inicial é uma estimativa da linha sem busca; busca e chips continuam no fluxo desde SSR, sem deslocamento do conteúdo por posicionamento fixed.
- `src/widgets/app-shell/components/SkipLink.tsx`: posição fixed mantém o primeiro link de foco acessível mesmo com a página já rolada; destino e semântica preservados.
- `src/features/search/components/client/SearchResultsSection.tsx`: mapa sticky usa altura do cabeçalho mais 24px; altura disponível usa `100dvh` menos cabeçalho e 48px de respiro. Sem mínimo de 480px que ultrapassaria viewports baixos. Mapa móvel continua no Dialog acima do header pelo z-index do tema.
- `src/features/listing-page/components/ListingPageScreen.tsx`: lateral sticky desktop usa a mesma variável mais 24px. O CTA móvel continua fixo no rodapé, sem mudança de contrato.
- `src/features/search/components/client/SearchResults/SearchResults.tsx`: dica "Tenta outras datas ou tira um filtro." apenas quando vazio e sem raio maior, sem erro e sem carregamento. Conserva "Mostrar mais" e ampliação de raio no fim da lista preenchida, conforme REQ-SRCH-010. Corrige a apresentação com duas casas em busca por região.

## Uso, dependências e limites

Consumidores existentes: home/resultados, AppShell (contas e cantinho). Reutiliza tema, componentes e copies; nenhuma duplicação, provider, hook público ou pasta técnica nova. AppShell continua server, composição do header passa a client. Slots ReactNode continuam aceitos. O CSS é o único consumidor da medida: sem estado React de altura, sem transporte ou permissão novos. Sem observer disponível permanece a medida inicial feita na montagem; navegadores suportados possuem ResizeObserver.

Stories: `AppShell.stories.tsx` cobre papéis, visitante, celular e página longa (`Rolagem`); `SearchResults.stories.tsx` acrescenta `DuasCasas`. Stories existentes de SearchResultsSection e ListingPageScreen cobrem mapa/lateral e mobile.

## Validação

- Funcional/composição: `npx vitest run src/widgets/app-shell/components/AppHeader.test.tsx src/widgets/app-shell/components/AppShell.test.tsx src/features/search/components/client/SearchResults/SearchResults.test.tsx src/features/search/components/client/SearchResultsSection.test.tsx src/features/listing-page/components/ListingPageScreen.test.tsx --maxWorkers=1`: 5 arquivos, 37 testes aprovados na primeira execução. Reexecução de AppHeader.test.tsx e SearchResults.test.tsx após preservar ampliação de raio: 2 arquivos, 13 testes aprovados.
- `npx tsc --noEmit`: aprovado também após stories/E2E novos.
- ESLint direcionado aos arquivos alterados: aprovado também após últimos ajustes.
- `e2e/mocked/sticky-header.spec.ts`: três jornadas por viewport (1440 e 390), scroll, header, offset real do mapa/lateral, CTA móvel, ausência de overflow, âncora e skip link. Planejados quatro prints `test-results/096-{results,listing}-{1440,390}-scrolled.png`. Execução e prints não realizados nesta worktree: em 24/10/2026 o coordenador determinou encerrar sem novos servidores e delegou a validação externa. Sem alegar integração com API real.
- Unitário isolado N/A: não há função pura nova; medida e cleanup são cobertos pelo teste funcional de AppHeader. Integração HTTP nova N/A: sem mudança de transporte/contrato; composição de tema/cache e responsividade é coberta pelos testes existentes e pelo navegador com backend simulado. Suíte completa não executada por orientação do coordenador devido à memória disponível.

Fonte visual: prancha existente preservada; a tarefa altera rolagem e os offsets, sem redesenhar o header.
