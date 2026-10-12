# Roadmap de specs · tela por tela

> Fonte: controllers de `pethost_backend/src` (11/10/2026), `pethost_backend/docs`, vault (`produto/contrato-api.md`, `design/21-mapa-de-telas.md`, critérios de aceite) e canvas "PetHost · Resultados de cantinhos". Cada linha vira uma pasta `specs/NNN-slug/` quando entra em `draft`.
> **API:** ✅ implementada · 🟡 acordar contrato com o backend antes de `approved` · ⛔ não existe (spec fica `draft`, nada de DTO inventado).

## Ordem e paralelismo

```
Fase 0  001 ferramentas ─┬─ 002 design system ─┐
                          └─ 003 HTTP + sessão ─┴─ 004 casca do app
Fase 1  010 login · 011 cadastro tutor · 012 cadastro anfitrião · 013 senha · 014 trocar conta · 015 minha conta
Fase 2  020 meus pets · 021 apresentar pet · 022 ficha/edição/fotos · 023 pets da casa
Fase 3  030 minha verificação · 031 admin: fila e decisão · 032 admin: contas · 033 admin: auditoria
Fase 4  040 home · 041 busca + mapa · 042 cantinho · 043 Stripe · 044 montar cantinho · 045 agenda
Fase 5  050 pedir · 051 pagar + Fechado! · 052 minhas estadias · 053 pedidos · 054 estadia · 055 conversas · 056 avaliar · 057 ganhos
```

- **Fases 0 a 3** usam só API que já existe: dá para entregar ponta a ponta agora.
- **Fases 4 e 5** dependem de módulos do backend ainda não implementados (listings, search, availability, bookings, payments, conversations, reviews).
- Dentro de uma fase, as specs são independentes e podem ir para agentes diferentes em paralelo depois da Fase 0.

---

## Fase 0 · Fundação (sem tela de produto)

| Spec                         | Entrega                                                                                                                                                                                                                                                                 | Detalhe                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **001 tooling-and-quality**  | Vitest (projetos unit/component/integration), Testing Library, MSW, Playwright (mocked/real, desktop/mobile), Storybook + addon a11y/vitest, `eslint-plugin-boundaries`, Prettier, geração de contratos do OpenAPI, geradores de slice/componente, scripts `verify`, CI | [spec completa](001-tooling-and-quality/)  |
| **002 design-system**        | Tema Quintal no MUI (tokens, fontes locais, sombras duras, molas), primitivos de `shared/ui`, ilustrações da marca, ícones                                                                                                                                              | [spec completa](002-design-system/)        |
| **003 http-and-session**     | Transporte HTTP, envelope e `ApiError`, microcopy de erros, env validado, BFF (proxy por lista permitida + handlers de sessão), cookies, refresh rotativo, CSRF, `getSession()`, providers                                                                              | [spec completa](003-http-and-session/)     |
| **004 app-shell-and-guards** | Widget `app-shell` (cabeçalho por conta: tutor, anfitrião e admin com cores diferentes; menus do escopo; seletor de conta), `proxy.ts` (redirecionamentos por papel), `loading`, `error` e `not-found` com a voz da marca                                               | [spec completa](004-app-shell-and-guards/) |

---

## Fase 1 · Contas (API ✅)

### 010 · Entrar · `/login`, `/admin/login`

- **Design:** `Fluxo-Conta` → "Entrar" (cena da porta que abre com o formulário).
- **API:** ✅ `POST /auth/sessions/login`; ✅ `POST /owners/reactivate` e `/hosts/reactivate` para conta pausada.
- **Código:** `features/auth`.
  - `LoginForm` (client), `useLoginMutation`, `loginFormSchema`, `authCopy`; usa `resolvePostLoginPath` (004) e `toSafeInternalPath` (003).
  - Reutiliza `SegmentedControl`, `PasswordField`, `Notice` e `DoorScene`.
- [Spec completa](010-login/).

### 011 · Criar conta de tutor · `/register/owner`

- **Design:** `Fluxo-Conta` → "Criar conta 1/2", "2/2", "Conta criada".
- **API:** ✅ `POST /owners/register` (conta, CPF e endereço numa chamada; 409 de e-mail ou CPF).
- **Código:** `features/owners`.
  - `OwnerRegistrationForm`, em 2 passos com `WizardProgress`, e `ownerRegistrationSchema`.
  - Reutilizáveis novos: `PasswordStrengthChecklist`, campos mascarados de CPF, CEP e telefone, e preenchimento de endereço por CEP (ViaCEP).
  - Reutiliza `ChoiceCardGroup` (tutor ou anfitrião, que leva à 012).
- **Pontos de atenção:**
  - ao terminar, a sessão já vem do cadastro;
  - "Prazer, Camila!" usa o `Celebration`;
  - de lá, segue para "Apresentar meu pet".
- [Spec completa](011-owner-registration/).

### 012 · Criar conta de anfitrião · `/register/host`

- **Design:** mesmo fluxo, variante anfitrião, sem CPF.
- **API:** ✅ `POST /users/register`.
- **Código:** `features/users`.
  - Reutiliza 90% da 011: o formulário compartilhado vai para `widgets/account-registration`, ou para `shared/ui/forms` se não tiver domínio.
  - **Decidir no design da 011.**
- **Ao terminar:** vai para "Minha verificação" (030).
- [Spec completa](012-host-registration/).

### 013 · Esqueci e troquei a senha · `/forgot-password`, `/reset-password`

- **Design:** `Fluxo-Conta` → "Esqueci a senha", "Link enviado".
- **API:** ✅ `POST /auth/password/forgot` (sempre 200), ✅ `POST /auth/password/reset` (token de uso único, 30 min).
- **Código:** `features/auth`.
  - Reutiliza `PasswordStrengthChecklist` e `SegmentedControl` (o tipo de conta).
- [Spec completa](013-password-recovery/).

### 014 · Trocar de conta · menu da casca + `/users/switch`

- **Design:** `Fluxo-Conta` → "Trocar de conta".
- **API:** ✅ `GET /users/me/accounts`, ✅ `POST /auth/sessions/switch`, que pede a senha da outra conta.
- **Código:** `features/auth`.
  - `AccountSwitcher` vai no `app-shell`.
  - Ao trocar: `queryClient.clear()` e `router.refresh()`.
- [Spec completa](014-account-switch/).

### 015 · Minha conta · `/users/profile`, `/users/password`, `/users/deactivate`

- **Design:** `Fluxo-Conta` → "Perfil (anfitriã)".
- **API:** ✅ `GET/PATCH /owners/me` e `/hosts/me` (identidade travada no host verificado); ✅ `PUT/DELETE …/avatar`; ✅ `POST /users/me/password`; ✅ `POST …/me/deactivate`.
- **Código:** `features/owners` e `features/hosts`.
  - Formulário de perfil com `LockedField`.
  - `AvatarUploader`, que reutiliza a base de `PhotoSlots`.
- [Spec completa](015-my-account/).

---

## Fase 2 · Pets (API ✅)

### 020 · Meus pets · `/pets`

- **Design:** `Fluxo-Pet` → "Meus pets".
- **API:** ✅ `GET /pets/me` (o dono vem uma vez no topo; vêm os ativos e os inativos).
- **Código:** `features/pets`.
  - `PetIdCard` (a carteirinha, nas variantes `compact` e `full`), `PetList`, `NewPetTile`, `petQueries.mine`.
  - Estado vazio: "Apresenta seu pet pra gente?".
- [Spec completa](020-my-pets/).

### 021 · Apresentar meu pet · `/pets/new`

- **Design:** `Fluxo-Pet` → passos 1 a 7, "Prazer, Pipoca!".
- **API:**
  - ✅ `POST /pets`;
  - ✅ `POST /pets/{id}/photos`: as fotos sobem **depois** de criar o pet, por foto, até 3, com 409 para foto repetida e 422 quando passa do limite.
- **Código:** `features/pets`.
  - `PetWizard` (orquestra), um componente por passo (`SpeciesStep`, `IdentityStep`, `BodyStep`, `HealthStep`, `RoutineStep`, `SocialStep`, `ReviewStep`).
  - Estado: `petWizardStore`, rascunho em memória e `sessionStorage` sem foto.
  - `petFormSchema` com as regras por espécie: porte obrigatório em cão, opcional em gato, proibido no resto; exótico exige descrição.
  - `PetIdCard` como prévia ao vivo.
- **Lib pura:** `requiresSize(species)`, `allowsSize`, `ageBucketToBirthDate`, `toCreatePetRequest`.
- **Reutiliza:** `WizardProgress`, `ChoiceCardGroup` (os 12 ícones de espécie), `SegmentedControl`, `ToggleRow`, `ChipPicker`, `PhotoSlots`, `Celebration`.
- [Spec completa](021-pet-registration/).

### 022 · Ficha, edição e fotos · `/pets/[petId]`, `/pets/[petId]/edit`

- **Design:** `Fluxo-Pet` → "Ficha completa".
- **API:**
  - ✅ `GET/PATCH /pets/{id}`: o PATCH é parcial; `""` limpa o campo; trocar a espécie limpa o porte;
  - ✅ fotos com `POST`, `PATCH` e `DELETE`;
  - ✅ `POST/DELETE …/deactivation` ("Tirar da lista" e "Voltar pra lista");
  - ✅ 409 de microchip.
- **Código:**
  - `PetEditForm` reutiliza os passos da 021 como seções.
  - `toUpdatePetRequest` monta o patch (diff entre o original e o editado).
  - Fluxo de "Tirar da lista" com texto neutro (regra semiótica).
- [Spec completa](022-pet-profile-and-photos/).

### 023 · Pets da casa (anfitrião aprovado) · `/pets` com conta host

- **Design:** `Fluxo-Cantinho` → "Pets da casa".
- **API:** ✅ as mesmas rotas de pets com token de host (404 `PET_KEEPER_NOT_FOUND` antes da aprovação); ✅ `GET /hosts/{hostId}/pets` (o que o tutor vê).
- **Código:** `features/pets`, reaproveitando 020 a 022. As diferenças são só de texto e da regra de aprovação, que fica no widget `host-onboarding`.
- [Spec completa](023-host-house-pets/).

---

## Fase 3 · Verificação e administração (API ✅)

### 030 · Minha verificação · `/host/application`, `/host/application/new`, `/host/application/documents`

- **Design:** `Fluxo-Verificacao` → os 3 passos, "Antes de começar", "Documento e CPF", "Fotos", "Em análise", "Recusada" e "Aprovada".
- **API:**
  - ✅ `GET/POST/PATCH/DELETE /hosts/me/application`;
  - ✅ `PUT …/documents` (multipart com `front`, `back` e `selfie`, tudo ou nada);
  - ✅ `POST …/submission`;
  - 422 de tentativas e de bloqueio.
- **Código:**
  - `features/host-applications`: `ApplicationNotice` (o combinado), `PersonTypeStep` (PF/PJ), `DocumentTypeStep`, `DocumentSlots` (as vagas com o desenho esperado), `ApplicationStatusTimeline`, `RejectionNotice` (motivo → texto) e `applicationCopy`.
  - Widget `host-onboarding`: o painel dos 3 passos.
- **Atenção:** as fotos de documento nunca vão para store nem para storage; ficam só no estado do formulário até o envio.
- [Spec completa](030-host-verification/).

### 031 · Admin: fila e decisão · `/admin/host-applications`, `/admin/host-applications/[applicationId]`

- **Design:** `Fluxo-Admin` → "Fila", "Conferir e decidir".
- **API:**
  - ✅ `GET /host-applications?status=`;
  - ✅ detalhe;
  - ✅ `GET …/documents/{kind}`, que devolve um link assinado de 5 min (pedir quando abrir, nunca guardar);
  - ✅ `POST …/approval` e `…/rejection`, com motivo obrigatório;
  - 409 de concorrência.
- **Código:**
  - widget `host-application-review`, com `ReviewChecklist`, `SignedDocumentViewer` e `DecisionPanel`;
  - `features/host-applications` (as chamadas de admin).
- [Spec completa](031-admin-verification-queue/).

### 032 · Admin: contas · `/admin/users`, `/admin/users/owners/[ownerId]`, `/admin/users/hosts/[hostId]`

- **API:** ✅ `GET /owners` e `/hosts`, detalhe, `POST/DELETE …/suspension`, `cpf-release` e `identity-release`, todos com motivo.
- **Design:** **sem board.** Usar o padrão da tela "Fila" (tabela) e do `DecisionPanel`. Desenhar no canvas antes de `approved`.
- [Spec completa](032-admin-accounts/).

### 033 · Admin: auditoria · `/admin/audit-entries`

- **API:** ✅ `GET /audit-entries`, paginado e com filtros (ver `modulo-audit.md`).
- **Código:** `features/audit`, com a `AuditTable` paginada e os filtros na URL.
- **Design:** **sem board.**
- [Spec completa](033-admin-audit/).

---

## Fase 4 · Descoberta e cantinho (API ⛔, contratos a acordar)

| Spec                    | Tela                                    | Design                                                        | API necessária                                         | Pontos de atenção                                                                                               |
| ----------------------- | --------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 040 home                | `/`                                     | `Quintal-Visitante` (sem pet) e `Quintal-Casas` (com pet)     | Busca ⛔; o conteúdo é estático                        | Hero com a turma e o "Cão ou gato?"; a versão estática pode sair antes da busca                                 |
| 041 busca + mapa        | `/search?where=&from=&to=&pets=`        | `Busca-Mapa` (computador, celular lista, celular mapa)        | `GET /listings/search` ⛔                              | Filtros na URL; pino por **bairro**; "Farejando cantinhos…"; mapa com Leaflet + OSM (escopo: "se sobrar tempo") |
| 042 cantinho            | `/listings/[listingId]`                 | `Fluxo-Reserva` → "Página do cantinho"                        | `GET /listings/{id}` ⛔, `GET /hosts/{hostId}/pets` ✅ | "Combina com seu pet"; nenhum dado privado antes do pagamento                                                   |
| 043 recebimentos Stripe | `/host/payments`                        | `Fluxo-Verificacao` → "Aprovada" (passo 2)                    | Onboarding Connect ⛔                                  | Componente embutido do Stripe com Appearance gerada dos tokens                                                  |
| 044 montar cantinho     | `/host/listings`, `/host/listings/edit` | `Fluxo-Cantinho` (painel, quem recebe, fotos, diária, aberto) | `listings` CRUD ⛔                                     | Simulação líquida de 90% como função pura testada                                                               |
| 045 agenda              | `/host/availability-blocks`             | `Fluxo-Cantinho` → "Agenda"                                   | `availability_blocks` ⛔                               | Calendário sem MUI X Pro; datas como `yyyy-MM-dd`                                                               |

## Fase 5 · Estadia (API ⛔)

| Spec                     | Tela                                                                        | Design                                               | API necessária                                                              |
| ------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| 050 pedir estadia        | `/listings/[listingId]/request`                                             | `Fluxo-Reserva` → "Pedir estadia", "Pedido enviado"  | `POST /bookings` ⛔                                                         |
| 051 pagar + Fechado!     | `/owner/bookings/[bookingId]/payments`                                      | `Desk-Pagamento` (**redesenhar no Quintal antes**)   | PaymentIntent ⛔; confirmação só por webhook                                |
| 052 minhas estadias      | `/owner/bookings`                                                           | `Fluxo-Reserva` → "Minhas estadias"                  | `GET /bookings/me` ⛔                                                       |
| 053 pedidos              | `/host/booking-requests`, detalhe                                           | `Fluxo-Anfitriao` → "Pedido com a ficha"             | aceitar e recusar ⛔; ficha do pet no pedido ⛔                             |
| 054 estadia em andamento | `/host/bookings/[bookingId]`                                                | `Fluxo-Anfitriao` → "Dia da chegada", "Em andamento" | check-in e check-out ⛔                                                     |
| 055 conversas            | `/conversations`, detalhe                                                   | `Fluxo-Conversas`                                    | `conversations` e `messages` ⛔; transporte (consulta periódica ou SignalR) |
| 056 avaliar              | `/owner/bookings/[bookingId]/reviews`, `/host/bookings/[bookingId]/reviews` | `Fluxo-Reserva` → "Avaliar"                          | `reviews` ⛔                                                                |
| 057 ganhos               | `/host/payouts`                                                             | `Fluxo-Anfitriao` → "Ganhos"                         | `payments` ⛔                                                               |

## Componentes compartilhados (criados na 002 e enriquecidos pelas telas)

| Pasta                    | Componentes                                                                                                                                                                                           | Primeira tela que usa |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `shared/ui/forms`        | `PasswordField`, `MaskedTextField` (CPF, CNPJ, CEP, telefone), `SegmentedControl`, `ChoiceCardGroup`, `ToggleRow`, `ChipPicker`, `Counter`, `FormActions`, `LockedField`, `PasswordStrengthChecklist` | 010 / 011 / 021       |
| `shared/ui/feedback`     | `Notice` (info, ok, atenção, erro), `Hint` (dica tracejada), `StatusPill`, `EmptyState`, `ErrorState`, `SniffLoader` (farejando), `Celebration`                                                       | 010 / 011             |
| `shared/ui/navigation`   | `WizardProgress` (trilha vertical no computador, anel "2/5" no celular), `FlowSectionList` (painel de seções com check)                                                                               | 011 / 030             |
| `shared/ui/data-display` | `Sticker`, `MoneyText`, `RatingValue`, `StatusTimeline`, `KeyValueList`                                                                                                                               | 030 / 041             |
| `shared/ui/media`        | `PhotoSlots` (N vagas, capa, tirar e trocar), `DocumentSlot`, `AvatarUploader`                                                                                                                        | 021 / 030 / 015       |
| `shared/ui/brand`        | `DoorMark` (logo), `DoorScene`, `TurmaWalker`, `Daisy`, `GroundLine`                                                                                                                                  | 010                   |
| `shared/ui/icons`        | espécies (12), comodidades, confiança                                                                                                                                                                 | 021                   |
| `shared/lib`             | `formatCents`, `formatCalendarDate`, `cpf`, `cnpj`, `cep`, `phone`, `usePrefersReducedMotion`, `springs`                                                                                              | 003 / 011             |
