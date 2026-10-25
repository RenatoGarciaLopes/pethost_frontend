---
spec: 066-booking-payment
status: approved
updated: 2026-10-23
area: PAY
---

# 066 · Pagamento da estadia

## Contexto e fontes

O tutor paga a estadia aceita com cartão ou Pix, dentro do PetHost. A primeira parcela paga confirma a reserva; parcelas seguintes são cobranças independentes, controladas pelo PetHost.

- API: `openapi/pethost.v1.json`, tags BookingPayment e Payments; `../pethost_backend/docs/modulo-payments.md`, seções 4 a 7.
- Design: vault `design/12-pagamento-e-fechado.md` e `assets/pranchas/desk-pagamento.png`.
- Produto: vault `produto/escopo-oficial.md` e `produto/contrato-api.md`; trechos antigos que dizem não existir pagamento são superados pelo contrato implementado.
- Base: specs 050, 052, 053 e 054; feature `bookings`; tradução global da 090.

## Critérios EARS

| ID          | Critério                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-PAY-001 | QUANDO o tutor abrir uma estadia `accepted` em Minhas estadias, O SISTEMA DEVE oferecer “Pagar estadia” para `/owner/bookings/{bookingId}/payment`, protegida por sessão owner, com UUID inválido ou reserva alheia tratados como 404.                                                                                                                                                                                                      |
| REQ-PAY-002 | QUANDO o pagamento carregar, O SISTEMA DEVE mostrar “Confirme e pague”, cantinho, anfitrião, pets, período, noites, diária por pet e total; duas colunas em 1440 e uma em 390, sem contato privado antes da confirmação. Foto só quando houver fonte real; ausência de foto tem apresentação própria, sem inventar URL.                                                                                                                     |
| REQ-PAY-003 | ENQUANTO houver `paymentDeadline`, O SISTEMA DEVE exibir o prazo em Brasília; ao vencer, DEVE impedir nova tentativa, atualizar pagamento/reserva e oferecer retorno à estadia, sem inventar 24h locais.                                                                                                                                                                                                                                    |
| REQ-PAY-004 | QUANDO a API fornecer `options`, O SISTEMA DEVE apresentar exclusivamente os planos retornados, seus valores e vencimentos, explicar que cada parcela é paga separadamente e enviar `{ installmentCount }` por PUT antes de abrir a sessão. Plano bloqueado/pagamento parcial não permite troca.                                                                                                                                            |
| REQ-PAY-005 | QUANDO existir parcela pagável, O SISTEMA DEVE abrir a sessão da primeira parcela pendente na ordem da API e renderizar Stripe Payment Element com cartão e Pix. A chave pública de teste vem exclusivamente de `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; chave ausente/inválida gera estado recuperável sem carregar checkout. Não persistir `clientSecret` em storage, URL, logs ou fixtures com dados reais.                                 |
| REQ-PAY-006 | QUANDO a tela carregar, O SISTEMA DEVE mostrar o lembrete curto “Lembrete: leve a ração e os remédios dos seus pets.”, presente na prancha. Não repetir checkbox obrigatório já aceito no pedido (091). Ao enviar DEVE evitar clique duplo e anunciar processamento.                                                                                                                                                                        |
| REQ-PAY-007 | QUANDO o Stripe pedir ação adicional ou o Pix estiver pendente, O SISTEMA DEVE manter o fluxo de confirmação do SDK na página, informar espera e validade disponível (`pixExpiresAt`), permitir voltar e consultar novamente, sem afirmar pagamento confirmado pelo retorno do navegador. QR code e eventuais ações de copiar pertencem ao SDK, sem reconstruir dados do Pix ausentes na API.                                               |
| REQ-PAY-008 | QUANDO o SDK retornar ou a pessoa consultar o resultado, O SISTEMA DEVE sincronizar por POST, reler a reserva e atualizar o cache de detalhe/listas. Só DEVE apresentar “Fechado!” após a API retornar reserva `confirmed` e primeira parcela paga; mostrar foco no título, “Ver a estadia” e contato apenas conforme dados liberados pela API. Pagamento ainda pendente continua em espera; sincronização com falha permite nova consulta. |
| REQ-PAY-009 | QUANDO qualquer chamada falhar, O SISTEMA DEVE usar `translateError`/`applyFieldErrors`, apresentar recuperação apropriada e não exibir mensagens cruas de Stripe/API, códigos nem segredos. Conflito, plano travado, parcela já paga ou processamento exigem releitura antes de nova cobrança; 404 usa a casca; expirada/cancelada bloqueia checkout.                                                                                      |
| REQ-PAY-010 | ENQUANTO houver carregamento inicial, sessão carregando, SDK indisponível, envio, espera, erro ou sucesso, O SISTEMA DEVE apresentar estado acessível por teclado e leitor de tela, região viva e ação coerente, respeitando redução de movimento. Stories e screenshots em 1440/390 devem cobrir esses estados e ausência de foto.                                                                                                         |
| REQ-PAY-011 | QUANDO uma estadia confirmada ainda tiver parcelas abertas, O SISTEMA DEVE permitir consultar o pagamento e pagar a próxima parcela permitida sem repetir a celebração da primeira confirmação; deve informar valores/vencimentos recebidos e acréscimo (`lateFee`/`amountDue`) quando houver.                                                                                                                                              |

## Fora do escopo

Ganhos do anfitrião, admin de pagamentos, implementação de webhook, formulário de cartão próprio, cálculo local de parcelas/multa, confirmação por temporizador, notificações novas e conversa ainda sem rota implementada. A ação de conversar só entra se o fluxo existente puder ser reutilizado.

## Decisões aprovadas

1. Parcelamento é por cobranças separadas do PetHost, inclusive após a estadia; a UI deve explicar isso e permitir voltar para parcelas seguintes.
2. A prancha pede foto do pet/cantinho, mas o DTO atual de booking não as fornece: reutilizar consulta pública existente quando houver dado suficiente, com fallback explícito.
3. O lembrete já é aceito ao pedir; nesta tela será texto curto sem checkbox obrigatório, conforme ajuste do coordenador.
4. O QR/código Pix é operado pelo Stripe, conforme contrato real, com ajustes de fidelidade limitados ao que o SDK permite.

## Estado

Spec aprovada pelo coordenador em 2026-10-23 antes da implementação da UI. Resultados reais e pendências estão em `validation.md`.

Aprovada pelo coordenador em 2026-10-23: lembrete curto sem checkbox; edição direta do vault compartilhado autorizada, sem pacote intermediário. Erros usam helpers atuais, com futura tradução 090 por baixo.
