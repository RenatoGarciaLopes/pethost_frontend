# 066 · Validação em andamento

Data: 2026-10-23. Branch `feat/066-booking-payment`; worktree `pethost_frontend-066`.

## Executado

- `git merge dev`: concluído no commit `9002094`. Snapshot de dev já contém todas as rotas de pagamento, todos os schemas atuais e o envelope de sucesso novo; `ErrorResponse` antigo foi substituído por `ApiErrorResponse`. Schemas foram regenerados, preservando dependências Stripe da branch.
- `npm run api:generate`: Orval concluído. Nenhum schema gerado editado manualmente.
- `npx tsc --noEmit`: base após merge aprovada antes da implementação do checkout.
- `npx vitest run --project unit src/shared/api/server/bffRoutes.test.ts`: 9 testes aprovados antes de acrescentar a regressão da 066.
- `npx vitest run --project integration-dom src/features/bookings/components/client/BookingPayment.int.test.tsx --maxWorkers=1`: 7 testes aprovados na primeira versão. Mudanças posteriores em foto, timeout do SDK e deadline ainda exigem reexecução.
- Rodada focada unit/component/integration: 26 testes passaram e 3 testes de `StripePaymentForm` falharam no mock do SDK. A rodada começou antes da disponibilização das dependências Stripe. O teste foi refeito usando o provider React Stripe real e um SDK sintético; reexecução pendente.
- Primeira rodada de `paymentState.test.ts`: 1 falha por data sintética sem zero no mês; fixture corrigida, reexecução necessária.
- `npx tsc --noEmit --incremental` durante implementação apontou matcher com RegExp e ausência dos pacotes Stripe. Matcher corrigido; coordenador instalou as versões do lockfile na junction. A rodada seguinte foi interrompida por pedido do coordenador, por falta de memória.

## Suspensão e fila

Coordenador determinou interromper typecheck/Vitest e servidores por memória disponível de 0,3 GB. O typecheck ativo foi interrompido; nenhum dev server da 066 foi iniciado. Só código e documentação continuaram.

Portas 3100/5099 são exclusivas; fila atual: Loam → Pixel → Quill → Wren → Rivet. Pixel foi avisado para chamar Quill ao liberar. Ao terminar a vez da 066, avisar Wren diretamente. Runner focado usa dev próprio 3177 e backend 5099 somente na vez autorizada, nunca em paralelo ao backend de outra branch.

## Checks pendentes após liberação

- Vitest focado com `--maxWorkers=1`: regras, contratos, rota, SDK, detalhe da estadia, integração e mock E2E.
- `npx tsc --noEmit` e ESLint dos arquivos tocados; Prettier focado.
- E2E: `npx playwright test --config playwright.payment.config.ts` com chave pública sintética passada por env e os mocks do SDK; nenhum dado Stripe real.
- PNGs em `test-results/066/`, desktop 1440 e mobile 390, com comparação visual à prancha `desk-pagamento.png`.
- Cenários preparados: ready, card, pix, waiting, success, expired, error, loading, no-photo e sdk-error. Capturas ainda não geradas.
- Storybook/stories/a11y ainda não executados.

## Limites

E2E com SDK e backend simulados não prova integração com API .NET, Stripe de teste ou banco real. Nenhuma cobrança real/teste externo foi executada. SDK controla os campos, QR e código Pix; a prancha só orienta a composição externa. Lembrete virou texto curto sem novo checkbox, ajuste aprovado pelo coordenador porque a 091 já registra o aceite no pedido. Foto da capa vem da consulta pública existente de listing-page, com fallback; não inventar foto de pet ausente no DTO.

Os helpers de erro existentes são usados como estão; a tradução da 090 pluga abaixo deles. Não há campos RHF novos: erros de operação usam `getErrorMessage`; `applyFieldErrors` não se aplica a um novo formulário de dados pessoais/cartão, pois esses campos pertencem ao Stripe.
