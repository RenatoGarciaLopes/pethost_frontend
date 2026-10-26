# 105 — Conversa na reserva

- Tutor: ação secundária com balão e nome do anfitrião, disponível no começo do detalhe em desktop e celular. POST idempotente com `listingId`, envio único enquanto pendente, loading no botão e navegação pelo `conversationPath` retornado. Erros traduzidos junto da ação.
- Anfitrião: encontrar conversa pelo `ownerId` da reserva usando `conversationQueries.mine`; link direto, contador de não lidas e acesso preservado quando bloqueada. Sem correspondência, explicar a iniciativa do tutor; erro e loading não são ausência.
- Preservar conteúdo e ações das duas telas, sem imports entre features.
- Limite aceito: primeira página de 50 conversas. Quando cheia, informar ausência apenas nesse recorte. Não há filtro por tutor nem criação pelo anfitrião na API.
