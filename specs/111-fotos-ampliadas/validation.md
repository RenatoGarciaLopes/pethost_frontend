# Validação

Em andamento em 26/10/2026. Resultados finais serão registrados após as execuções.

- `npx tsc --noEmit`: aprovado.
- Primeira rodada de `npx vitest run src/features/listing-page src/shared/ui/media --maxWorkers=1`: 81/82; identificou fixture de rerender sem provider e ausência de PointerCapture no jsdom. Testes corrigidos sem alterar o render helper compartilhado.
- E2E atualizado, ainda não executado; aguarda coordenação do servidor.

## Resultado da retomada

`node node_modules/vitest/vitest.mjs run src/features/listing-page src/shared/ui/media --maxWorkers=1`: **83 testes em 15 arquivos aprovados** depois de corrigir os testes. `node node_modules/vitest/vitest.mjs run --config vitest.111.tmp.config.ts src/shared/ui/media/PhotoLightbox/PhotoLightbox.stories.tsx src/features/listing-page/components/ListingGallery.stories.tsx --maxWorkers=1`: **6 stories aprovadas com axe**, inclusive após sobrepor setas para preservar espaço útil da foto no celular. Stories de gestos usam pointer events sintéticos e neutralizam apenas captura de IDs sintéticos; não representam dispositivo físico.

Capturas Playwright em test-results/111/: galeria, visualizador e zoom, 1440/390. Imagens sintéticas locais, sem dados reais; visualizador mobile e galeria desktop inspecionados. Nenhum pacote instalado. Configs temporárias removidas na entrega. E2E de listing-page atualizado, execução registrada separadamente após integração.

## E2E da integração (26/10/2026)

Worktree isolada de validação a partir da dev integrada, Next webpack na porta 3180 e backend simulado na 5099, preservando o servidor do usuário na 3000. Comando: `node node_modules/@playwright/test/cli.js test --config playwright.recovery.tmp.config.ts e2e/mocked/bookings/my-stays.spec.ts e2e/mocked/search/listing-page.spec.ts e2e/mocked/pets/new-pet.spec.ts e2e/mocked/pets/pet-profile.spec.ts --grep "REQ-STAYS-001|REQ-STAYS-006|REQ-LPAGE-001|REQ-PNEW-016|REQ-PEDIT-004" --project=mocked-desktop --project=mocked-mobile --workers=1` (segunda rodada com `--last-failed`, que executou novamente os dez casos). **10/10 aprovados, 2,9 min na segunda rodada**.

Primeira rodada: timeouts de navegação/compilação em rotas frias no desktop e seletor novo de cancelamento que buscava texto isolado apesar da vírgula acessível no marcador. Seletor corrigido para conferir o marco Cancelada/parou; a repetição passou sem aumentar os timeouts. Logs de desenvolvimento também registraram falha ao carregar Stripe.js externo; esses casos não validam o SDK real nem pagamento. Backend simulado não equivale à integração com API real. Configuração temporária removida na entrega; resultados locais em `.agent-tools/recovery-e2e-repeat.log`, fora do Git.
