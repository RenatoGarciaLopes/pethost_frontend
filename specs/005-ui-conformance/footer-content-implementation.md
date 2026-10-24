# 093: conteúdo no rodapé de terra

Implementado na worktree `pethost_frontend-093`, branch `feat/093-footer-content`.

## Interface e reutilização

`GrassFooter` aceita `mobileBottomSpace?: number` (padrão 0, unidades do tema, só mobile) e usa `GroundLine`, `DoorMark`, `PageContainer`, `MuiLink`, `keyboardFocus`, `registerPath` e `LOGIN_PATH`. Sua raiz agora é um `footer` com landmark `contentinfo`; apenas a ilustração permanece escondida da leitura assistiva. Consumidores: home e AppShell público/tutor/anfitrião, incluindo cantinho aberto; auth/admin continuam fora. Não contém transporte HTTP, cache ou permissões próprias. Depende do tema Quintal e dos providers existentes. Exemplo: `<GrassFooter />`.

`src/shared/ui/brand/GrassFooter/grassFooterCopy.ts` centraliza textos e cinco destinos existentes: `/`, `/#como-funciona`, `/register/host`, `/login`, `/register/owner`. O fragmento é absoluto para funcionar também no cantinho. Termos e privacidade não têm rotas implementadas e continuam sem links.

`src/shared/config/contact.ts` exporta `ContactChannel` (label e href mailto/tel/https) e `CONTACT_CHANNELS`, lista readonly de canais públicos aprovados. O rodapé lê diretamente essa fonte. Lista vazia oculta integralmente a coluna de contato, sem placeholder; nenhuma informação foi presumida. Dados aguardam aprovação pelo Renato via coordenador. Só usar canais públicos aprovados. Não contém HTTP, estado, cache ou credenciais.

`sceneColors.soilContent` é a base estável de terra escura do conteúdo; papel no texto e foco, coral no sublinhado. Fica fora do filtro de escurecimento dos SVGs. Contraste WCAG medido: papel 11,33:1, coral 3,90:1; mínimos testados 4,5:1 para texto e 3:1 para indicadores. Títulos display, três colunas a partir de md quando há contato, duas sem contato, e uma no celular. Alvos de links com altura mínima 44px. Direitos usam o ano corrente do ambiente de renderização. DoorMark acompanha a marca sem interação decorativa.

Sem diretórios técnicos novos ou recursos duplicados. Configuração cabe em shared/config; copy interna permanece junto ao componente. Inventário atualizado em `docs/folder-structure.md` e recursos/decisão/catálogo/linha do tempo do vault.

## Testes e limites

- Unitário: `src/shared/theme/tokens/contrast.test.ts`, contraste de texto e indicadores.
- Funcional: `GrassFooter.test.tsx`, landmark, cinco destinos, ano, contato vazio/configurado (dados sintéticos), preservação da animação e movimento reduzido.
- Integração de composição: `AppShell.test.tsx`, landmark depois do main para tutor/anfitrião e ausência no admin, usando providers reais de teste. `src/app/page.int.test.tsx` cobre a home real com MSW; seletor Entrar agora restrito ao banner. MSW isolado não se aplica ao rodapé, que não usa HTTP.
- Browser/a11y: stories do rodapé e da casca com axe em modo error, navegação, celular e movimento reduzido.
- E2E mocked: `e2e/mocked/grass-footer.spec.ts`, home, cantinho, navegação ao fragmento, foco só por Tab, ausência em auth/admin e capturas em 1440/390. `e2e/mocked/home/home.spec.ts` restringe Entrar ao banner para não confundir com o novo atalho do footer. Não representa integração com API real.

## Validação

- `npx vitest run src/shared/ui/brand/GrassFooter/GrassFooter.test.tsx src/shared/theme/tokens/contrast.test.ts src/widgets/app-shell/components/AppShell.test.tsx --maxWorkers=1`: 24 testes em 3 arquivos aprovados. Após ocultar contato vazio e reutilizar DoorMark, repetidos GrassFooter/AppShell: 20 aprovados; tokens sem alterações posteriores.
- `npx vitest run src/app/page.int.test.tsx --maxWorkers=1`: 11 testes de integração aprovados.
- `npx vitest run --config vitest.footer-temp.config.ts src/shared/ui/brand/GrassFooter/GrassFooter.stories.tsx --maxWorkers=1`: 3 stories aprovadas com axe antes da reserva mobile; rodada final de GrassFooter e AppShell: 10 stories aprovadas com axe. Config temporária permitiu o destino real da junction em server.fs.allow; removida da entrega. O comando com config padrão falhou antes por restrição de acesso do Vite, sem executar stories.
- `npx tsc --noEmit`: aprovado. ESLint dos arquivos tocados e `git diff --check`: aprovados.
- E2E final: 6 testes do rodapé + 2 da composição home aprovados em desktop/mobile, com Next webpack na 3178 e mock na 5099, após liberação pelo Rivet. Prints finais inspecionados em `test-results/093-prints/`: home/cantinho 1440/390, páginas completas e recortes do rodapé. A rodada inicial revelou sobreposição dos direitos pela barra fixa, corrigida com reserva mobile; também teve timeouts durante compilação fria e espera de conteúdo após navegação ao fragmento. A repetição passou com rotas aquecidas, DOMContentLoaded nas páginas da casca e limites locais adequados.

Referência visual inspecionada: `assets/pranchas/quintal-casas.png` do vault. A prancha termina com faixa de gramado sem texto; a extensão em camadas de terra da 073 e a base de conteúdo da 093 são diferenças intencionais solicitadas por Renato. Não se declara equivalência pixel a pixel.

## Reserva mobile para barra fixa

A captura inicial revelou direitos cobertos pela barra Pedir estadia no cantinho. `GrassFooter` e `AppShell` aceitam agora `mobileBottomSpace?: number` (padrão 0), em unidades do tema e aplicado somente abaixo de md. A rota do cantinho usa 12 quando há barra (`!isOwner`), 0 no cantinho próprio. A reserva fica dentro da base escura. Stories novas documentam o estado; E2E verifica a posição dos direitos acima do CTA e a integração do cantinho cobre a composição. O uso sem props permanece válido.

Rodada final após a reserva: GrassFooter/AppShell/integração do cantinho, 21 testes aprovados em 3 arquivos. Somando home (11) e contraste (4), são 36 testes relevantes sem repetições.

E2E final, com `CI=1` e configuração temporária para webpack na 3178/mock na 5099:

- `npx playwright test --config playwright.footer-temp.config.ts e2e/mocked/grass-footer.spec.ts --project=mocked-desktop --project=mocked-mobile --workers=1`: 6 aprovados.
- `npx playwright test --config playwright.footer-temp.config.ts e2e/mocked/home/home.spec.ts --grep 'home tem casa' --project=mocked-desktop --project=mocked-mobile --workers=1 --output=test-results/093-home-validation`: 2 aprovados.

Configurações temporárias removidas. Contato aguarda valores aprovados; coluna oculta, sem placeholder.
