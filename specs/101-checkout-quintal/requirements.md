# 101 — Checkout com a cara do Quintal

Escopo: composição visual de BookingPaymentView; hook, contrato e fluxo Stripe preservados.

- Planos em ChoiceCardGroup, com teclado nativo, ordem e valores exclusivamente da API; escolha envia installmentCount. Sem alternativas quando a API trava o plano.
- Vencimentos em lista acessível “Vencimentos das parcelas”, valor forte, data em chip e divisórias tracejadas.
- Lembrete verde com ícone e borda de tinta, sem checkbox (REQ-PAY-006).
- CTA principal coral largo e garantia com cadeado; ausência de chave explica o que falta.
- StaySummary reaproveitado com Surface, capa/fallback, datas, pets, conta aberta e total autoritativo do pagamento.
- Desktop em duas colunas; 390 com resumo compacto primeiro, sem overflow horizontal.
- Estados de sessão, espera, encerramento, prazo, parcelas com acréscimo, pago, erro e sucesso preservados.

Referências lidas: telas-reserva.png, desk-pagamento.png, design/12-pagamento-e-fechado e design/00-criterios-de-aceite no vault. Nenhum endpoint, dependência ou regra financeira novo.
