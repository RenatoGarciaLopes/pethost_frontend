# Composição e recursos — 101

## BookingPayment / BookingPaymentView

Path: src/features/bookings/components/client/BookingPayment.tsx. Interfaces preservadas: BookingPayment({accountId, bookingId, coverUrl?}) monta o hook; BookingPaymentView({state, bookingId, coverUrl?}) apresenta seu estado. Client, autenticado como tutor; queries/efeitos continuam no useBookingPayment. Foco de sucesso permanece no h1. Dependências: MUI, tema Quintal, NextLink, ChoiceCardGroup, Notice, StaySummary e StripePaymentForm.

Planos usam labels “À vista · valor” / “n× de valor” obtidos de firstAmount; description com Total da API para parcelas iguais ou valores individuais de options.installments para parcelas desiguais, sem dividir total ou inventar opções. O grupo usa layout responsive; busy desabilita a escolha. Sem sessão mostra a lista ordenada com número, valor, vencimento em Brasília e acréscimo retornado pela API. StatusPill deixa a data plana, com contorno e sem sombra. As parcelas persistidas usam status/paidAt da API: paga com pílula verde e valor secundário, overdue com atenção e a primeira pagável identificada pelo helper existente com “Próxima”. Sem inferir atraso por data local. Não usa StatusTimeline: seus estados done/current/todo significam progresso e acrescentariam semântica incorreta a um calendário financeiro. Lista fica interna à composição, sem componente paralelo.

Notice ok atende o lembrete com borda e ícone; nenhum aceite novo. CTA usa contained/large/fullWidth do tema, seguido de garantia com SVG de cadeado decorativo local. Sem chave de teste, o aviso explica a configuração faltante. paymentCopy em lib/paymentCopy.ts concentra labels; planLabel(count, amount) recebe o valor formatado da primeira parcela, planTotal(amount) o total e installment(number) dá o ordinal. installmentPaid(paidAt?) formata dd/mm em Brasília; sem paidAt diz apenas “Paga”. installmentOverdue e installmentNext são labels de apresentação. Copy retirada do resumo antigo foi removida; Stripe continua usando pay/unavailable.

## StaySummary

Path: src/features/bookings/components/client/StaySummary.tsx, export existente. Props booking: Booking, checkout?: {totalAmount, paidAmount} em reais, cover?: ReactNode. Exemplo: <StaySummary booking={booking} checkout={{totalAmount: payment.totalAmount, paidAmount: payment.paidAmount}} cover={photoOrFallback} />.

Sem checkout mantém os dados e o layout do detalhe 097. Com checkout mostra identificação da casa/anfitrião/bairro, caixa chegada/saída, chips de pets, conta e Total do pagamento (não recalcula). cover é slot da composição; erro de imagem continua local a BookingPaymentView. Surface mantém raio, contorno 2px e sombra dura. Não busca foto nem conhece Stripe. No celular a capa é miniatura única de 72×72 ao lado do nome, o título redundante Resumo é ocultado e a ordem visual/DOM é voltar, h1, prazo, aside e planos; no desktop fica na coluna de 340px. Sem novo provider, store ou pasta técnica.

## ChoiceCardGroup

Path: src/shared/ui/forms/ChoiceCardGroup/ChoiceCardGroup.tsx. Extensões opcionais layout: stacked | responsive (padrão stacked) e labelVariant: body | section (padrão body). section transforma o FormLabel em h2 com a tipografia da seção Forma de pagamento. Responsive usa uma coluna até md e colunas iguais em md, uma por opção, sem alterar valor, onChange, disabled ou teclado nativo. Consumidor real: checkout. Story Responsive cobre a nova composição; stories anteriores e consumidores mantêm o padrão.

Limite: grupo para poucas opções, não para listas extensas. ChoiceCard permanece sem alteração; não cria um sistema de cartões concorrente. Detalhes de catálogo no vault em development/resources/choice-card-group.

## Testes e limites

Integração/funcional: BookingPayment.int.test.tsx cobre rádio por teclado/clique, ordem, valores desiguais da API, installmentCount, total autoritativo, lock de plano, capa com erro e estados existentes. StayDetail.test.tsx protege o consumidor anterior de StaySummary. ChoiceCardGroup.test.tsx + stories exercitam o primitivo nativo. paymentState.test.ts cobre regras puras existentes; não há regra financeira nova que exija nova unidade.

Revisão r1 acrescenta teste funcional de status e heading acessível, além de assertions no Chromium de rótulo sem quebra em 1440, ordem mobile, planos antes de 720px e ausência de overflow. Stories Chromium/a11y cobrem todos os estados apresentados, inclusive Encerrado, Pago e Planos. Capturas são renderizações de stories, sem backend real. E2E payment.spec.ts teve selectOption/combobox migrados para radio/radiogroup; execução deliberadamente reservada ao CI. Nenhuma execução com Stripe/API real é alegada. Comandos/resultados e diferenças visuais em validation.md.
