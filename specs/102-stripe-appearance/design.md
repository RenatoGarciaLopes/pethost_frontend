# Design e recursos

## StripePaymentForm / PaymentForm

Componentes client internos de bookings em `src/features/bookings/components/client/StripePaymentForm.tsx`. Interface preservada: session: PaymentSession, returnPath: string, onSubmitted: () => Promise<void>. Compor dentro do checkout; requer chave pública test no ambiente e Stripe disponível. Uso: `<StripePaymentForm session={session} returnPath={path} onSubmitted={synchronize} />`.

`stripeAppearance` é constante privada na mesma unidade, sem export sem consumidor. Reutiliza quintalColors, quintalRadii.field e quintalTypography; remove apenas o wrapper var do fontFamily porque variáveis CSS do pai não atravessam o iframe. Elements.fonts carrega Atkinson Hyperlegible Next 400/700 por Google Fonts. Regras públicas de Appearance estilizam Input, Tab, seleção, foco e Label. Sem duplicação de tokens, novo provider ou pasta de produção.

PaymentForm guarda method inicialmente pix; PaymentElement.onChange usa value.type, inclusive quando Stripe selecionar outro método automaticamente. Aviso usa session.pixExpiresAt e formatDeadline existente; desmonta em métodos diferentes de pix. Envio, erro, prontidão e confirmação continuam existentes. Limite: DOM, ícones e textos internos pertencem ao Stripe; não é um ChoiceCard renderizado pela aplicação. Aparência não controla autenticação externa ou QR após confirmação.

## BookingPaymentView / paymentCopy

Paths: `src/features/bookings/components/client/BookingPayment.tsx` e `src/features/bookings/lib/paymentCopy.ts`. Interface e resetSession preservados. Retorno usa changePlan quando options não vazio, paidAmount zero e installmentNumber um; return nos demais casos. Chave change removida. Consumidores: checkout e suas stories/testes. Sem alteração de contrato HTTP, cache ou permissão.

## createStripeSdkFixture

Path: `src/test/stripeSdk.ts`. Factory existente exclusiva de testes, sem mudança da interface settings. A seleção sintética agora emite change com value.type, como o Payment Element, permitindo testar o aviso pelo SDK React real sem criar outro mock. Usada por testes/E2E existentes; não equivale ao Stripe real.

## Validação por nível

- Unitário/funcional: StripePaymentForm.test.tsx cobre prazo inicial, card oculta e pix restaura; regressões de envio/prontidão/erro existentes.
- Integração: BookingPayment.int.test.tsx usa MSW/providers/cache e verifica rótulo/retorno com plano disponível, travado, pagamento parcial e segunda parcela.
- Aparência: configuração sem função pura nova; validação visual com Stripe real em 1440/390 e stories/a11y. Não criar teste que apenas replique objetos de CSS.
- E2E: aplicável à jornada, execução explicitamente reservada ao CI pelo brief; nenhum seletor com texto antigo encontrado em e2e. Capturas reais não confirmam pagamento nem substituem E2E de cobrança.

Referência da integração: https://docs.stripe.com/elements/appearance-api . Resultados e limites reais em validation.md.
