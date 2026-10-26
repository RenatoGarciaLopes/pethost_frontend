# 106 — Fotos por arraste

Status: implemented; validação em [validation.md](validation.md).

- Reordenar fotos preenchidas numa grade responsiva por mouse, toque, teclado e menu. Vagas vazias permanecem no fim; cadastro do pet continua sem reordenação porque não fornece `onMove`.
- Mouse ativa após 8 px; toque após 250 ms com tolerância de 5 px, permitindo rolagem antes da ativação. Espaço pega/solta, setas movem, Escape cancela.
- A posição zero é capa. `onMove(from, to)` recebe índices base zero uma vez ao soltar; não chama durante movimento, cancelamento ou quando não mudou.
- Envio e disabled bloqueiam todos os sensores e ações. Não mudar o contrato HTTP ou o comportamento de persistência do consumidor.
- Remover colunas de ordenação; menu por foto com capa, antes e depois, somente destinos aplicáveis. Na revisão r1, trocar e tirar passam ao mesmo menu nas fotos reordenáveis: botão ⋯ mínimo 44×44 px; menu com fonte 14 px em negrito, cor tinta e itens de pelo menos 44 px.
- Foto levantada com sombra dura, inclinação de 1,5°, mola assentar, indicador de destino tracejado e cursor. Reduced motion remove inclinação e transições. Anúncios e instruções em português.
- Testes funcionais, integração HTTP simulada e stories Chromium; E2E reservado ao CI por instrução do brief. Prints em 1440 e 390.
