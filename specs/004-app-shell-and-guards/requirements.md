---
spec: 004-app-shell-and-guards
status: in-progress
updated: 2026-10-13
area: SHELL
---

# 004 · Casca do app e proteção de rotas

## Contexto

Toda tela logada mora dentro da mesma casca: cabeçalho, menu da conta e as telas de carregando, erro e "não encontrado". A mesma pessoa pode ter conta de tutor e de anfitrião ([[20-conta-e-entrada]]), então a casca precisa dizer **onde ela está** sem esforço (cor do cabeçalho e frase do menu). As rotas de cada papel precisam ficar fechadas para os outros papéis, sem piscar conteúdo antes de redirecionar.

## Referências

- **Design:** canvas "PetHost · Resultados de cantinhos", cabeçalhos de todos os boards `Fluxo-*` (computador 1440 e celular 390); loading em `Loading-Caes`. Vault: `design/21-mapa-de-telas.md` (cor do cabeçalho por conta), `design/20-conta-e-entrada.md` (trocar de conta), `design/02-orcamento-de-personalidade.md` (intensidade zero nas telas de conta).
- **API:**
  - ✅ `GET /api/v1/users/me` (conta atual, via `getSession`);
  - ✅ `GET /api/v1/users/me/accounts` → `[{ role, isActive, isCurrent }]` (mostra "Trocar pra …" só se a outra conta existe e está ativa);
  - ✅ `POST /api/v1/auth/sessions/logout` (pelo BFF, spec 003).
  - Claims do JWT (`pethost_backend/docs/modulo-auth.md` seção 6.5): `role` existe e serve só para o redirecionamento otimista do `proxy.ts`.
- **Depende de:** 002 (tema, `Sticker`, `SniffLoader`, `ErrorState`, `EmptyState`), 003 (`requireSession`, `getSession`, `bffClient`, `QueryProvider`, `appRoutes`).
- **Usada por:** 010 em diante (todas as telas logadas e as de conta).

## Histórias

- Como tutora com conta de anfitriã também, quero ver na hora em qual conta estou, para não pedir estadia como anfitriã por engano.
- Como anfitrião, quero que os atalhos do menu sejam os da minha conta (verificação, cantinho, pedidos), não os do tutor.
- Como admin, quero uma casca separada e sóbria, sem o cadastro público.
- Como visitante, quero cair no login (e voltar para onde eu ia) quando abrir uma página que exige conta.

## Critérios de aceite

| ID            | Critério                                                                                                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-SHELL-001 | O SISTEMA DEVE mostrar o cabeçalho com a cor da conta: tutor `#FEFAF3` (papel), anfitrião `#EEF3D6` (gramado claro), admin `#EDE6DA`; visitante usa o do tutor                                                                                                         |
| REQ-SHELL-002 | O SISTEMA DEVE mostrar no cabeçalho só os atalhos do papel atual, a partir de uma tabela única de navegação; atalho de tela ainda não implementada NÃO DEVE aparecer                                                                                                   |
| REQ-SHELL-003 | O menu da conta DEVE mostrar foto ou iniciais, nome e a frase "Você está como tutora / tutor / anfitriã / anfitrião / admin"; a flexão vem de um campo de tratamento quando existir, senão usa a forma neutra "Conta de tutor" / "Conta de anfitrião"                  |
| REQ-SHELL-004 | QUANDO `GET /users/me/accounts` trouxer a outra conta ativa, O menu DEVE oferecer "Trocar pra conta de …", que leva a `/users/switch` (spec 014); SE a chamada falhar, o item NÃO DEVE aparecer e o resto do menu continua                                             |
| REQ-SHELL-005 | QUANDO a pessoa escolher "Sair", O SISTEMA DEVE chamar o logout do BFF, limpar todo o cache do TanStack Query e ir para `/login`; com a API fora do ar, sai mesmo assim (o BFF apaga os cookies)                                                                       |
| REQ-SHELL-006 | ENQUANTO a largura for menor que 900 px, O cabeçalho DEVE virar barra compacta com logo, botão de menu (gaveta) e avatar; a gaveta lista os mesmos atalhos, prende o foco e fecha com Esc, com o foco voltando ao botão que a abriu                                    |
| REQ-SHELL-007 | O SISTEMA DEVE oferecer o link "Pular para o conteúdo" como primeiro foco da página, apontando para o `main`                                                                                                                                                           |
| REQ-SHELL-008 | O atalho da página atual DEVE ser marcado com `aria-current="page"` e destaque visual que não dependa só de cor                                                                                                                                                        |
| REQ-SHELL-009 | O `proxy.ts` DEVE redirecionar para `/login?next=<rota>` quem abrir rota de conta sem cookie de sessão, e para a casa do próprio papel quem abrir rota de outro papel segundo a claim `role` (checagem otimista: sem chamar a API)                                     |
| REQ-SHELL-010 | O layout de cada área (tutor, anfitrião, admin e as rotas das duas contas, como `/pets`) DEVE confirmar o papel no servidor com `requireRole` (conta vinda da API, nunca do JWT); papel errado → casa do papel; sem sessão → refresh ou login (spec 003, REQ-HTTP-016) |
| REQ-SHELL-011 | `/admin/*` DEVE usar a casca de admin, sem link de cadastro e sem cena da marca; `/admin/login` fica fora da proteção                                                                                                                                                  |
| REQ-SHELL-012 | QUANDO uma rota estiver carregando, O SISTEMA DEVE mostrar o `SniffLoader` ("Farejando…") com `role="status"`; com `prefers-reduced-motion`, sem animação                                                                                                              |
| REQ-SHELL-013 | SE uma página quebrar, O SISTEMA DEVE mostrar o `ErrorState` na voz da marca, com "Tentar de novo" (`reset`) e o `traceId` quando o erro for `ApiError` 5xx; nunca a pilha nem a mensagem técnica                                                                      |
| REQ-SHELL-014 | SE a rota não existir, O SISTEMA DEVE mostrar "Esse cantinho não existe" com link para a casa do papel (ou `/` para visitante), com status 404                                                                                                                         |
| REQ-SHELL-015 | O erro global (`global-error`) DEVE funcionar sem o tema carregado (HTML e estilo mínimos) e oferecer recarregar                                                                                                                                                       |
| REQ-SHELL-016 | A tabela "casa do papel" DEVE ser única e compartilhada (login, proxy, 404, guards): tutor → `/`, anfitrião → `/host`, admin → `/admin/host-applications`                                                                                                              |

## Estados da tela

| Estado                       | O que aparece                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| Carregando a rota            | `SniffLoader` centralizado, cabeçalho já visível                                              |
| Menu sem foto                | Iniciais sobre o círculo coral                                                                |
| Contas vinculadas carregando | Menu abre sem o item de troca; o item entra quando chega (sem pular layout: espaço reservado) |
| Erro na página               | `ErrorState` dentro da casca; cabeçalho continua navegável                                    |
| Erro no layout raiz          | `global-error` com HTML mínimo                                                                |
| 404                          | Cena curta com o corgi farejando e link de volta                                              |

## Fora do escopo

- A tela de troca de conta com senha (spec 014); aqui só o item de menu.
- Busca no cabeçalho (spec 041).
- Notificações e contador de conversas (spec 055).
- Rodapé de marketing da home (spec 040).

## Perguntas em aberto

- **Menu do anfitrião:** `produto/escopo-oficial.md` cita "Agenda" e "Estadias" no menu do anfitrião; o `NAV_ITEMS` usa Painel, Minha verificação, Meu cantinho, Pets da casa, Pedidos e Ganhos (rotas do roadmap). Definir a lista final com o produto antes da 044/053.

- **Tratamento (tutora/tutor, anfitriã/anfitrião):** a API não tem campo de pronome ou tratamento. Até existir, o menu usa "Conta de tutor" e "Conta de anfitrião" (REQ-SHELL-003). Levar ao produto: perguntar o tratamento no cadastro ou manter neutro.
