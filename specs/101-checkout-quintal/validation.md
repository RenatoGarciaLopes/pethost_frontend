# Validação — 101 (25/10/2026)

## Resultados

- npx vitest run src/features/bookings/lib/paymentState.test.ts src/features/bookings/components/client/BookingPayment.int.test.tsx src/features/bookings/components/client/StripePaymentForm.test.tsx src/test/msw/bookingPaymentMock.int.test.ts src/shared/ui/forms/ChoiceCardGroup/ChoiceCardGroup.test.tsx src/features/bookings/components/client/StayDetail.test.tsx --maxWorkers=1: 37 testes em 6 arquivos aprovados. Após acrescentar o caso de valores desiguais, rerun de BookingPayment.int.test.tsx: 15/15 aprovados (substitui os 14 desse arquivo na rodada de 37; total de casos distintos cobertos: 38).
- npx vitest run --config vitest.storybook.101.config.ts src/features/bookings/components/client/BookingPayment.stories.tsx src/shared/ui/forms/ChoiceCardGroup/ChoiceCardGroup.stories.tsx --maxWorkers=1: 18/18 aprovados, Chromium + a11y. Repetidos junto das capturas, novamente aprovados.
- Capturas via stories temporárias: 19 renderizações/aprovações (9 estados × 2 larguras e fallback 390), mais 2 capturas sem chave. Verificação de scrollWidth <= viewport para os 18 estados principais. O arquivo temporário de captura foi removido; não foi criada página de teste em produção.
- npx tsc --noEmit aprovado; ESLint dos 8 arquivos TS/TSX alterados aprovado. Checks finais registrados na entrega Git.
- E2E pesado não executado, por instrução do brief. e2e/mocked/bookings/payment.spec.ts migrou selectOption para radio.check e ausência de combobox para radiogroup. Não afirmar aprovação do CI nem integração API/Stripe real.

## Ambiente e tentativas

node_modules é junction; nenhum npm install/ci executado. Storybook-vitest precisou de config temporário com server.fs.allow = C:/Users/Renato Lopes/Desktop/PetHost. Só allow não bastou: Vite comparava caminho longo com o alias Windows Renato~1 e recusava error-catcher.js. O config temporário também desativou fs.strict apenas no runner local; arquivo removido ao final, sem alterar configurações permanentes.

A tentativa de servidor Storybook completo falhou no cache do manager por acesso/caminho da junction (e settings globais não graváveis). Capturas foram feitas pelo runner de stories Chromium, com comando temporário que expande iframe/viewport para registrar a página toda, não pelo app/servidor Next. Servidor tentado foi encerrado, main.ts e debug-storybook.log restaurados. Nenhum servidor alheio foi encerrado.

## Evidências e diferenças

Pasta local: test-results/101/. Arquivos estado-1440.png e estado-390.png para ready, waiting, error, expired, closed, paid, installments, sdk e success; missing-key nas duas larguras; no-photo-390.png. comparison-estado.png reúne desktop/celular atuais, telas-reserva.png e desk-pagamento.png lado a lado, com rótulos. PNGs são artefatos locais ignorados pelo Git; esta nota é o índice versionado.

Conferidos visualmente ready em 1440 e 390: duas colunas, contorno/sombra dura, datas separadas por tracejado, pets em chips, total display, aviso verde, ação coral e garantia; celular com resumo primeiro e todo o conteúdo acessível verticalmente. Estado missing-key explica a configuração e mantém botão desabilitado legível.

Diferenças deliberadas ou limitações reais:

- Capa dos testes é a fixture sintética listingPhotosFixture (SVG de paisagem), não a foto real de cachorro da prancha. Nomes/bairro/datas vêm das fixtures existentes; valores formatados com centavos. Produção usa coverUrl recebido da API ou fallback.
- Os planos de teste são à vista/3×, conforme fixture/API; a prancha antiga tratava Pix/cartão. A escolha de método permanece exclusivamente no Payment Element.
- Sem checkbox de lembrete, conforme decisão posterior de 23/10. Lembrete e garantia são genéricos para os pets, não personalizados como no protótipo.
- Capturas isolam a composição em Container, sem header/footer do app. Celular usa capa de 72px e heading redundante de resumo oculto; mantém casa, pets, datas e total.
- Estado sdk nas stories usa sessão sintética e retorno de configuração/carregamento do wrapper; não há validação visual de campos/QR reais do Stripe. O formulário interno permanece do SDK, coberto funcionalmente por mock existente.
- Fechado preserva o feedback implementado da 066; não implementa a cena ilustrada antiga da prancha.

## Níveis aplicáveis

Unitário: paymentState existente, nenhuma regra financeira nova. Funcional/integração: BookingPayment.int.test.tsx (teclado, clique, ordem, valores desiguais, installmentCount, total autoritativo, capa, lock e estados), StripePaymentForm.test.tsx e StayDetail.test.tsx para consumidores preservados; infraestrutura HTTP simulada em bookingPaymentMock.int.test.ts. Shared ChoiceCardGroup coberto por teste existente e story Responsive, sem API nova. E2E aplicável à jornada, execução pendente no CI por instrução. Build completo não executado: alteração de composição, com typecheck e testes direcionados; não confundir checks estáticos com testes de comportamento.
