---
spec: 010-login
status: in-progress
updated: 2026-10-11
---

# 010 · Tarefas

Pré-requisito: 001, 002 (T6, T9, T10) e 003 (T1 a T6, T11, T12) concluídas.

- [x] **T1 · Schema** (2026-10-11) (REQ-AUTH-003)
  - Teste primeiro: `features/auth/schemas/loginFormSchema.test.ts`
  - Implementar: `loginFormSchema.ts`, `features/auth/index.ts`
- [x] **T2 · Redirecionamento seguro** (2026-10-11) (REQ-AUTH-005, 006)
  - Já pronto nas specs 003 e 004: `toSafeInternalPath`, `resolvePostLoginPath` e `ROLE_HOME` (com testes). Aqui só conferir o uso.
- [x] **T3 · Microcopy da tela** (2026-10-11) (REQ-AUTH-002, 007 a 011)
  - Teste primeiro: `authCopy.test.ts` (ajuda por papel; códigos delegados a `getErrorMessage`)
  - Implementar: `features/auth/lib/authCopy.ts`
- [x] **T4 · Cliente e mutations** (2026-10-11) (REQ-AUTH-004, 005, 008, 018)
  - Teste primeiro: `useLoginMutation.int.test.tsx`, `useReactivateMutation.int.test.tsx` (MSW no BFF)
  - Implementar: `api/client/auth.client.ts`, `api/mappers/toLoginRequest.ts`, `hooks/*`
- [x] **T5 · useCountdown** (2026-10-11) (REQ-AUTH-010)
  - Teste primeiro: `shared/hooks/useCountdown.test.ts` (relógio falso)
- [x] **T6 · LoginForm, caminho feliz** (2026-10-11) (REQ-AUTH-001 a 004, 012, 013)
  - Teste primeiro: `LoginForm.test.tsx`
  - Implementar: `features/auth/components/client/LoginForm/*` + story
- [x] **T7 · LoginForm, erros** (2026-10-11) (REQ-AUTH-007 a 011)
  - Teste primeiro: `LoginForm.errors.test.tsx`
- [x] **T8 · Variante admin** (2026-10-11) (REQ-AUTH-015)
  - Teste primeiro: `LoginForm.admin.test.tsx`
- [x] **T9 · TrustList** (2026-10-11) (reutilizável)
  - Teste primeiro: `TrustList.test.tsx`; story
- [x] **T10 · LoginScreen + páginas** (2026-10-11) (REQ-AUTH-014, 016, 017, 019)
  - Implementar: `LoginScreen` (server), `app/(auth)/layout.tsx`, `login/page.tsx`, `admin/login/page.tsx`
- [ ] **T11 · E2E simulado** (REQ-AUTH-005, 007, 014, 016 a 019)
  - Escrever `e2e/mocked/auth/login.spec.ts` (desktop + mobile)
- [ ] **T12 · E2E real** (REQ-AUTH-005)
  - Escrever `e2e/real/auth/login.spec.ts` com o seed de demonstração; registrar o ambiente usado
- [x] **T13 · Conferência de design** (2026-10-11)
  - Comparar com o `Fluxo-Conta` "Entrar" no computador e no celular
  - Passar a lista de `design/00-criterios-de-aceite.md`; anotar as divergências como tarefa ou ajuste de spec
- [x] **T14 · Documentação** (2026-10-11)
  - TSDoc de todos os exports; stories
  - Catálogo do vault: `useCountdown`, `TrustList`, `LoginForm`
  - `design/20-conta-e-entrada.md`: link para os arquivos reais
  - Status da spec → `done`

- [x] **T15 · Tela que se monta e cena interativa** (2026-10-12) (REQ-AUTH-020, 021)
  - `Reveal` em saudação, título, cartão, campos e garantias; aviso do formulário entra e sai com "assentar"
  - `DoorScene` com Motion, sem cachorro, de brincar; um só `h1` para computador e celular

## Registro de desenvolvimento (2026-10-11)

Feito pelo Claude Code. O Renato pediu para construir as telas primeiro e deixar os testes novos para depois.

**Arquivos**

- `features/auth`: `schemas/loginFormSchema.ts`, `lib/authCopy.ts`, `api/client/auth.client.ts` (`login`, `reactivateAccount`, `toLoginRequest`), `hooks/useSessionStartMutation.ts`, `hooks/useLoginMutation.ts` (`useLoginMutation`, `useReactivateMutation`), `components/client/LoginForm.tsx`, `components/LoginScreen.tsx`; índices `index.ts`, `index.client.ts`, `index.server.ts`.
- `shared`: `hooks/useCountdown.ts`, `ui/data-display/TrustList` (com story), `lib/url/searchParams.ts` (`firstParam`), `theme/overrides/Link.ts`.
- `app/(auth)`: `layout.tsx` (noindex), `login/page.tsx`, `admin/login/page.tsx`, `AuthPageFallback.tsx`.
- `e2e/support/screenshot-login.mjs`: capturas para revisão visual (não é teste).

**Decisões e achados**

- **Cache Components (Next 16):** sessão e `searchParams` ficam dentro de `<Suspense>`, com o `SniffLoader` de fallback. Assim quem já está logado é redirecionado sem ver o formulário (REQ-AUTH-014).
- **Bug pego na conferência visual:** o TanStack Query 5 passa um 2º argumento ao `mutationFn`. O `login(values, transport)` recebia esse contexto como transporte e a tela mostrava o erro genérico. O `useSessionStartMutation` agora repassa só as variáveis. Erro que não é da API vai para o console em desenvolvimento.
- **`isApiError`:** passou a usar uma marca `Symbol.for`, além do `instanceof`, para funcionar entre cópias do módulo.
- **Reativação:** usa as credenciais do último envio, guardadas só em memória pela mutação (`loginMutation.variables`).
- **Contraste dos links:** em tinta com sublinhado coral, aplicado no tema para o app inteiro. Coral sobre branco fica perto de 3:1.
- **REQ-AUTH-007:** a frase segue `errorCopy.ts` ("aqui em cima").

**Conferência real** (`next dev` com o backend simulado, Chromium, capturas em 1440 × 960 e 390 × 844):

- tutor, anfitrião (`?as=host`), admin, erro de credencial e validação vazia batem com o board `Fluxo-Conta`;
- no celular, o botão Entrar aparece sem rolar;
- e-mail com espaços e maiúsculas é normalizado;
- `next` interno respeitado e externo ignorado;
- cookies HttpOnly;
- `/login` com sessão redireciona.

**Pendências**

- **T11 e T12 (E2E da tela) e todos os testes de componente da matriz:** dívida de testes.
- **Link de suporte na conta suspensa (REQ-AUTH-009):** não existe página nem canal de suporte definido. A frase aparece sem link. **Pergunta em aberto:** qual é o canal de suporte?

## Registro de desenvolvimento (2026-10-12)

Pedido do Renato: tirar o cachorro correndo da tela de entrar, a página se construir de forma animada e organizada, a porta e o quintal interativos, com Motion; e nenhum código morto.

**O que mudou**

- `LoginScreen`: um layout para os dois tamanhos com **um só `h1`**. Antes, no celular o `h1` ficava dentro de um bloco `display: none` e o título visível era um `<p aria-hidden>`: leitor de tela ficava sem título no celular. A cena vem antes do título só visualmente (`order`).
- Montagem (REQ-AUTH-020): `Reveal` (ordens 0 a 7, 60 ms entre blocos, mola "assentar"). O primeiro quadro já sai do servidor invisível, sem piscar antes de hidratar.
- `LoginForm`: campos entram um a um (ordens 3 a 7); o `Notice` entra e sai com "assentar" (`AnimatePresence`).
- `DoorScene` (REQ-AUTH-021): ver o registro de 2026-10-12 da spec 002.
- `/` não existe mais (a página de teste do tema saiu). Até a home (spec 040), quem entra como tutor cai no 404 padrão do Next, porque a casa do tutor é `/`.

**Conferência real** (Chromium; `next dev` em 1440 × 960 e 390 × 844, e `next build` + `next start` contra o backend simulado):

- quadros em 80, 250, 500, 900 e 1800 ms: título, cartão e campos entram em ordem; a cena se desenha (céu, horizonte, porta, folha, capacho, flores);
- clique no gramado planta flores; mouse na porta entreabre; clique na porta abre e volta; foco no e-mail abre a porta; mouse em "Entrar" abre mais e esquenta a luz;
- clicar no gramado com o e-mail focado mantém o foco no e-mail;
- celular: `h1` visível e o botão Entrar termina em 745 px (tela de 844);
- movimento reduzido: cena completa e parada;
- 9 carregamentos sem erro no console;
- `npm run test:e2e:mocked`: 18 de 18 (os testes do design system agora usam `/login`).

**Pendências**

- Testes de componente do `Reveal` e da `DoorScene` (plantar, porta, foco preservado) entram na dívida de testes.

## Registro de testes (2026-10-12, feat/010-login-motion)

Dívida de cobertura quantitativa paga sem alterar código de produção ou thresholds. Matriz detalhada por recurso, níveis aplicáveis e limites em [login-coverage.md](../../docs/login-coverage.md); comandos e métricas em [validation.md](../../docs/validation.md#12102026--dívida-de-cobertura-em-feat010-login-motion).

- Componentes: LoginForm, LoginScreen e TrustList por composição; validação, conta errada, foco, reativação com credenciais do último envio, suspensão sem link, contagem 429, falhas, admin e links.
- Integração MSW: auth.client e hooks de login/reativação, contratos, cache e redirecionamentos.
- Guards e parâmetros: regras de acesso, sessão/papel, caminho seguro, RoleGate e parâmetros repetidos.
- Biblioteca visual: DoorScene e hooks de foco/ponteiro, flores, limite de plantio, movimento reduzido, marca, loader, turma, feedback, Reveal e WizardProgress.
- E2E: cinco novas jornadas em desktop e celular para validação sem POST, conta errada, sucesso/HttpOnly/next seguro, next externo e cena com foco/movimento reduzido. Reativação e 429 são verificados nos testes do formulário com MSW, sem afirmar E2E dessas situações ou integração à API real.

O link de suporte segue pendente de definição do canal. A documentação de validação no vault aguarda sincronização, respeitando o escopo de escrita somente no worktree.
