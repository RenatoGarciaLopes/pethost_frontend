---
spec: 055-conversations
status: draft
updated: 2026-10-23
area: CHAT
---

# 055 · Conversas

## Contexto

Tutor e anfitrião conversam antes de fechar e durante a estadia, que vira um diário com fotos ("Foto todo dia"). A
interface pode ser vista no Storybook sem login e sem backend (`Conversas/Prévia sem backend`). Em 23/10/2026 as rotas
`/conversations` e `/conversations/[conversationId]` foram ligadas à API, com atualização periódica no lugar do hub.
No anúncio, o tutor escreve a primeira mensagem antes de navegar para a conversa; `POST /conversations` recupera a
conversa única da dupla e `POST /conversations/{conversationId}/messages` envia o texto. Denunciar, bloquear e o
contador no cabeçalho ficam para depois.

## Referências

- **Design:** prints da tela de Conversas enviados pelo Gustavo em 23/10/2026 (computador e celular). O board
  `Fluxo-Conversas` do canvas e os critérios de aceite de design do vault **não estavam acessíveis** nesta máquina.
- **API:** `POST /conversations` (`{ listingId }`, cria ou recupera a conversa tutor–anfitrião; `201` nova, `200`
  existente), `GET /conversations/me`, `GET /conversations/{id}`, `GET /conversations/{id}/messages?before=&pageSize=`,
  `POST .../messages`, `POST .../messages/photo`, `PUT .../read-marker`, `PUT/DELETE .../block`,
  `GET /conversations/me/unread-count` (status: implemented no OpenAPI versionado; já na lista do BFF). Hub SignalR
  `/hubs/conversations` com `messageCreated`, `unreadCountChanged` e `conversationBlockChanged` (documentação técnica,
  seção 3.9; não descrito no OpenAPI).
- **Specs de que depende:** 004 (casca), 052 e 054 (estadia em andamento).

## Critérios de aceite

| ID           | Critério                                                                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-CHAT-001 | QUANDO a conta abre Conversas, O SISTEMA DEVE listar as conversas com foto e nome do outro lado, a última mensagem ("Você:" quando foi dela), quando foi e as não lidas |
| REQ-CHAT-002 | ENQUANTO uma conversa está aberta, O SISTEMA DEVE marcá-la na lista (contorno, sombra e `aria-current`)                                                                 |
| REQ-CHAT-003 | SE a conta não tem conversas, ENTÃO O SISTEMA DEVE explicar onde elas nascem                                                                                            |
| REQ-CHAT-004 | QUANDO a conversa abre, O SISTEMA DEVE mostrar as mensagens em ordem de leitura, separadas por dia de Brasília ("Ontem", "Hoje", "8 out")                               |
| REQ-CHAT-005 | O SISTEMA DEVE mostrar as mensagens de quem vê à direita e as do outro lado à esquerda, com a hora; o leitor de tela ouve quem disse                                    |
| REQ-CHAT-006 | QUANDO a mensagem tem foto, O SISTEMA DEVE mostrar a foto com a legenda logo abaixo                                                                                     |
| REQ-CHAT-007 | SE há mensagens mais antigas, ENTÃO O SISTEMA DEVE oferecer "Ver mensagens anteriores" (cursor `before`)                                                                |
| REQ-CHAT-008 | QUANDO a pessoa envia texto, O SISTEMA DEVE enviar sem os espaços das pontas (Enter envia, Shift+Enter quebra linha); vazio não sai; acima de 2.000 avisa               |
| REQ-CHAT-009 | QUANDO a pessoa escolhe uma foto, O SISTEMA DEVE aceitar só JPG, PNG ou WebP até 5 MB, mostrar a prévia e enviar com a legenda opcional                                 |
| REQ-CHAT-010 | ENQUANTO a conversa está bloqueada, O SISTEMA DEVE trocar o campo por um aviso (por quem vê, pelo outro lado ou pela moderação) e manter o histórico legível            |
| REQ-CHAT-011 | ENQUANTO há estadia acontecendo, O SISTEMA DEVE mostrar o cantinho, "Pipoca aqui · dia N de M", a faixa da estadia e a chegada no meio da conversa                      |
| REQ-CHAT-012 | NO celular, O SISTEMA DEVE mostrar a lista ou a conversa (com voltar), e a conversa ocupa a tela inteira                                                                |
| REQ-CHAT-013 | QUANDO o tutor inicia contato no anúncio, O SISTEMA DEVE manter a pessoa no anúncio até ela escrever e enviar uma mensagem não vazia; DEVE iniciar ou recuperar a conversa pelo cantinho, enviar o texto e só então abrir `/conversations/{id}`; em falha, deve manter o texto, informar e permitir nova tentativa |

## Divergências entre o design e a API (decidir antes de `approved`)

| No print                                    | O que foi feito                 | Motivo                                                                                                               |
| ------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| "14h31 · lida" na mensagem enviada          | Só a hora                       | A API não conta ao remetente se foi lida (`Sem readAt`; documentação técnica 3.9: "O remetente não vê lida")         |
| Etiquetas na foto ("Comeu bem", "Passeou"…) | Não mostradas                   | A mensagem só tem `body` e `imageUrl`; não há campo de boletim                                                       |
| "A Pipoca chegou", "a Pipoca está"          | "Pipoca chegou", "Pipoca está"  | Regra do app de não presumir gênero (como em `bookingCopy`, "{Pet} chegou")                                          |
| "casa da Dona Cida"                         | "casa de Dona Cida"             | Mesma regra                                                                                                          |
| Selo "Em andamento"                         | "Acontecendo"                   | É o nome do status `in_progress` em todas as telas de estadia (`statusLabel`)                                        |
| "20 a 25 dez"                               | "20 a 25 de dez."               | Formato único do período (`formatPeriod`, spec 052)                                                                  |
| "Casa da Dona Cida · Jd. Alvorada"          | Vem da estadia                  | A conversa da API não traz o cantinho; sem estadia, o cabeçalho mostra só o nome                                     |
| "Conversas (2)" no cabeçalho                | Atalho "Conversas" sem o número | O atalho entrou na casca e na home (tutor e anfitrião; visitante não). O contador depende do `unread-count` e do hub |

## Em aberto

- **Tempo real:** a documentação técnica conecta o navegador direto no hub com o token na query, mas no front o token
  fica em cookie HttpOnly e o JavaScript nunca o recebe. Precisa de decisão com o backend (ex.: token curto só para o
  hub, emitido pelo BFF) antes de implementar.
- Nomes de rota: o resumo do backend recebido em 23/10 cita `PUT /{id}/read`, `POST /{id}/block|unblock` e
  `/preferences`, mas o OpenAPI versionado (fonte dos contratos, D1) tem `read-marker`, `PUT/DELETE block` e
  `notification-settings`. Vale o OpenAPI até o backend dizer o contrário.
- Denunciar e bloquear pela conversa e o aviso por e-mail ficam para depois.
