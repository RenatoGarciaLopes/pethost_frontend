# 102 — Stripe no visual Quintal

Status: implemented; validação em validation.md.

- Payment Element com cores, raio de campo e tipografia dos tokens existentes; fonte carregada no iframe.
- Campos/abas com borda de tinta de 2px, papel, seleção verde e foco visível; CTA coral largo.
- Prazo Pix visível inicialmente e apenas enquanto o método selecionado for pix.
- Retorno “Trocar o plano” quando há opções, nenhum valor pago e primeira parcela; demais casos “Voltar”.
- Preservar hook, contratos e confirmPayment; não confirmar pagamento nas capturas.
- E2E reservado ao CI; sem instalação de dependências, push ou PR.
