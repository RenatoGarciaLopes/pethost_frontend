# 093: conteúdo no rodapé de terra

Implementação na worktree `pethost_frontend-093`, branch `feat/093-footer-content`. A revisão de acabamento solicitada antes do merge substitui a base em painel pela camada de terra contínua e adapta os links à conta.

## Interface e reutilização

`GrassFooter` usa `GroundLine`, `DoorMark` com wordmark, `PageContainer`, `MuiLink`, `keyboardFocus`, `registerPath`, `LOGIN_PATH` e `NAV_ITEMS`. Raiz `footer` com landmark `contentinfo`; somente desenho é aria-hidden. Consumidores: home, AppShell público/tutor/anfitrião e cantinho aberto; admin/auth ficam fora. Sem HTTP, cache, permissões próprias ou consulta de sessão. Depende do tema Quintal e providers existentes.

Props opcionais: `accountRole?: AccountRole` (ausente: visitante; caller passa papel confirmado da sessão), `mobileBottomSpace?: number` (padrão 0, unidades do tema, apenas abaixo de md). Exemplo: `<GrassFooter accountRole="owner" mobileBottomSpace={12} />`.

`src/shared/ui/brand/GrassFooter/grassFooterCopy.ts` centraliza textos e três destinos comuns: `/`, `/#como-funciona`, `/register/host`. O fragmento absoluto funciona no cantinho. Apenas visitante recebe `/login` e `/register/owner`; tutor recebe Minhas estadias `/owner/bookings`; anfitrião recebe Painel `/host`. Atalhos pessoais são lidos de NAV_ITEMS. Admin na home pública não recebe links de autenticação nem atalhos pessoais. Termos e privacidade não têm rotas implementadas e continuam sem links. O wordmark digitado foi removido do copy.

`src/shared/config/contact.ts` exporta `ContactChannel` (label e href mailto/tel/https) e `CONTACT_CHANNELS`, lista readonly de canais públicos aprovados. O rodapé lê essa fonte. Lista vazia oculta integralmente a coluna de contato, sem placeholder. Dados aguardam aprovação pelo Renato via coordenador. Não contém HTTP, estado, cache ou credenciais.

## Terra contínua e layout

A última camada inteira usa `sceneColors.soilDeep`, escurecida para papel 11,33:1 e coral 3,90:1 antes da animação; mínimos testados 4,5:1/3:1. `soilContent` foi removido, migrar para `soilDeep`. O mesmo `--soil-deep` preenche a onda e continua sob os textos. O desenho não tem borderBottom reta; preenchimento profundo sem stroke inferior, somente contorno ondulado no topo. Não há painel de tom separado.

Rolagem mistura cada tom de terra/pedras com tinta em até 30% via `color-mix`, compartilhando variáveis CSS entre SVG e fundo do conteúdo. O texto não recebe filtro e mantém papel; a grama não escurece. Movimento reduzido mantém tons estáticos sem listeners de scroll. A progressão de light/mid/deep continua testada. `--descida` é atualizada por RAF, sem re-render a cada evento.

Sem contato: marca ocupa uma fração e navegação duas no desktop; links em duas colunas, aproveitando a largura. Com contato: três colunas principais, links em uma. No mobile, tudo empilhado; links com altura mínima 44px. Direitos usam ano corrente.

Marca usa `<DoorMark withWordmark wordmarkColor="quintal.papel" interactive={false} />`, a mesma assinatura minúscula do cabeçalho. `DoorMarkProps.wordmarkColor?: string` é novo e opcional, preservando `text.primary` no cabeçalho; a cor só altera o wordmark, mantendo folha coral/luz.

A captura inicial revelou direitos sob a barra Pedir estadia no cantinho. `AppShell` repassa mobileBottomSpace ao GrassFooter. A rota do cantinho usa 12 com barra (`!isOwner`), 0 no cantinho próprio, reservando o fim da terra escura no mobile. Nenhuma regra de compra foi alterada.

Sem diretórios técnicos novos ou recursos duplicados. Inventário atualizado em `docs/folder-structure.md`; recursos, catálogo, decisão e linha do tempo no vault.

## Testes e limites

- Unitário: `src/shared/theme/tokens/contrast.test.ts`, contraste e progressão dos tons.
- Funcional: `GrassFooter.test.tsx`, landmark, assinatura, destinos por papel, ano, contato vazio/configurado (dados sintéticos), animação e movimento reduzido; `brand.test.tsx`, DoorMark padrão/papel, escala e semântica.
- Integração: `AppShell.test.tsx`, passagem do papel e posição/ausência do footer; `src/app/page.int.test.tsx`, home real com MSW e papel da sessão; `src/app/listings/[listingId]/page.int.test.tsx`, composição pública do cantinho. MSW isolado do rodapé/símbolo N/A: não usam HTTP. Unitário de lógica separada da marca N/A: comportamento coberto na composição.
- Browser/a11y: stories de GrassFooter (visitante/tutor/anfitrião/mobile/reserva/redução de movimento), AppShell (papéis e reserva mobile), DoorMark (assinatura em terra); axe em modo error.
- E2E mocked: `e2e/mocked/grass-footer.spec.ts`, animação, links por sessão, igualdade das cores calculadas da onda/fundo, ausência de borda reta/stroke inferior, assinatura em papel, direitos acima do CTA, navegação ao fragmento e ausência auth/admin. Capturas de home/cantinho × 1440/390 × visitante/logado (tutor). `home/home.spec.ts` verifica composição responsiva da home. Não representa integração com API real.

## Validação

Entrega inicial (commit 81a82af): 36 testes unitários/funcionais/integração, 10 stories com axe e 8 E2Es aprovados; tsc/lint aprovados. Capturas iniciais em `test-results/093-prints/` foram revisadas pelo coordenador e motivaram a revisão visual acima. Rodada inicial teve timeouts de compilação fria e revelou direitos sob a barra mobile, corrigidos antes do commit.

Revisão de acabamento: 48 testes em 6 arquivos aprovados (GrassFooter, AppShell, brand, contraste, integração da home e do cantinho). Contraste repetido após o ajuste dos extremos da mistura: 4 aprovados. GrassFooter/AppShell/DoorMark: 17 stories aprovadas no Chromium, incluindo axe nos cenários definidos. Typecheck/lint aprovados. Em 24/10/2026, o coordenador determinou encerrar os processos locais e entregar o commit; a validação E2E e os novos prints desta revisão ficam pendentes para o agente cloud/coordenador. Configurações temporárias Storybook/Playwright removidas. Nenhum servidor ou teste novo foi iniciado nessa entrega final. Não executar npm install/ci: node_modules é junction compartilhada.

Referência inspecionada: `assets/pranchas/quintal-casas.png` do vault. A prancha termina em gramado sem texto; camadas de terra e conteúdo são extensões intencionais solicitadas por Renato. Não se declara equivalência pixel a pixel.
