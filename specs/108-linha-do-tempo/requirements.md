# 108 — Uma linha do tempo de verdade

Pedido: a trilha "Pediu, confirmou, chegou" parecia uma seleção de pontos (rádio) e confundia. Precisa de cara de linha do tempo, igual em todo o app.

- **REQ-TL-001** Um componente só: `StatusTimeline` (shared) é a linha do tempo da estadia do tutor, da reserva do anfitrião e da verificação. O `StayTimeline` da feature sai.
- **REQ-TL-002** Trilho contínuo ligando os marcadores: sólido em tinta até onde já se chegou, tracejado e mais claro no que falta.
- **REQ-TL-003** Marcadores que não parecem rádio: feito = círculo grama com ✓; agora = círculo gema maior com anel e a pílula "agora" visível; falta = contorno tracejado sem preenchimento; parou = círculo coral com ✕. Nunca um círculo vazio de contorno sólido.
- **REQ-TL-004** Sempre horizontal, também no celular (390): etapas em colunas de largura igual, trilho atravessando, marcador menor (26 px; 32 px no computador), rótulo curto em negrito e data embaixo (fonte menor, centralizada, até 2 linhas, quebrando só entre palavras), sem rolagem horizontal.
- **REQ-TL-005** Cada etapa aceita um detalhe opcional (momento feito ou só o dia previsto, como "dom., 20 de dez."); o estado vem do marcador e do texto oculto, não da palavra "previsto".
- **REQ-TL-006** Recusada, expirada e cancelada mostram onde parou: etapas feitas até ali + uma etapa "parou" com o nome da situação, sem etapas futuras. O motivo segue no texto que já existia ("O que aconteceu", aviso do anfitrião).
- **REQ-TL-007** A11y: `ol` com nome, `aria-current="step"` só na atual, estado em texto ("feito", "agora", "falta", "parou"), nada interativo (sem foco nem cursor de clique), sem movimento, contraste AA.
- **REQ-TL-008** O resto das três telas não muda.
