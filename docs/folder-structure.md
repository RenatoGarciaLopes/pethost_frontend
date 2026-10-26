# Estrutura real do frontend

## Conversa na reserva (105)

R1: `src/features/conversations/components/client/UnreadBadge.tsx` concentra o selo antes privado de ConversationList, público por `index.client.ts` e reutilizado no widget. `conversationsCopy.booking` reúne os textos no arquivo de copy existente. Sem nova pasta técnica.

```text
src/widgets/booking-conversation/
  BookingConversation.tsx           composição client bookings + conversations
  BookingConversation.int.test.tsx  MSW: criação, falhas, lookup e limite
  index.ts                         export público do widget
src/app/BookingConversationPreview.stories.tsx  duas telas, três cenários
specs/105-chat-na-reserva/           requirements, design, tasks, validation
```

As rotas existentes `(owner)/owner/bookings/[bookingId]/page.tsx` e `(host)/host/bookings/[bookingId]/page.tsx` compõem o widget no slot `conversation` dos Screens e detalhes. O POST fica no cliente existente de conversations; IDs continuam nos mapeadores existentes das features. Sem provider/store ou utilitário de teste reutilizável novo. [Interfaces e limites](../specs/105-chat-na-reserva/design.md), [validação](../specs/105-chat-na-reserva/validation.md).

## Pagamento da estadia (066)

Implementação na feature bookings existente, em validação. Não há módulo global novo de pagamentos.

```text
src/app/(owner)/owner/bookings/[bookingId]/payment/
  page.tsx                         guarda owner, UUID, metadata e capa opcional via listing-page
  page.test.tsx                    composição, autorização e fallback da capa
src/features/bookings/
  api/paymentContracts.ts          schemas derivados dos contratos gerados
  api/paymentQueries.ts            query de pagamento isolada por conta
  api/client/paymentMutations.client.ts  plano, sessão e sincronização pelo BFF
  hooks/useBookingPayment.ts       orquestração, cache, retorno Stripe e prazo
  lib/paymentState.ts              próxima parcela, prazo e confirmação
  lib/paymentState.test.ts         regras e limites
  lib/paymentCopy.ts               copy do fluxo sem tradução paralela
  components/BookingPaymentScreen.tsx  RSC e hidratação da reserva
  components/client/BookingPayment.tsx  composição client e BookingPaymentView
  components/client/BookingPayment.int.test.tsx  HTTP/cache/UI com MSW
  components/client/BookingPayment.stories.tsx   estados isolados da tela
  components/client/StripePaymentForm.tsx        fronteira Elements/PaymentElement
  components/client/StripePaymentForm.test.tsx   wrapper real com SDK sintético
  components/client/StripePaymentForm.stories.tsx  configuração indisponível/mobile
src/test/fixtures/bookingPayment.ts fixtures sintéticas de pagamento/sessão
src/test/stripeSdk.ts               SDK DOM sintético exclusivo de testes
src/test/msw/bookingPaymentMock.int.test.ts contrato/autorização do mock
e2e/support/stripePayment.ts        instalação/interceptação do SDK no browser do teste
e2e/support/handlers/bookings.mjs   operações de pagamento e controle externo paid no mock existente
e2e/mocked/bookings/payment.spec.ts jornadas desktop/mobile e capturas
playwright.payment.config.ts       runner focado, dev 3177 webpack, backend 5099 exclusivo
specs/066-booking-payment/          requirements, design, tasks e validação real
```

`StayDetail` liga para `ownerBookingPaymentPath`, exportado pelo índice neutro; a lista de cards pertence à 094. Sessões Stripe ficam em memória, fora de cache hidratado. Recursos e limites: vault `development/resources/booking-payment.md`. E2E/prints e checks finais ainda pendentes.

## Fidelidade da home (005, T7, primeiro lote)

`src/widgets/app-shell/components/AppHeader.tsx` extrai o cabeçalho comum; `src/widgets/app-shell/index.ts` oferece sua API síncrona à rota pública, enquanto index.server mantém a casca dos layouts. Home e casca compartilham header sem um widget importar outro. `src/app/HomeFidelity.stories.tsx` compõe os dois widgets como a rota; o HomeScreen continua responsável por um único main.

`src/shared/ui/brand/DoorScene/HouseScene.tsx` implementa somente a variante house do DoorScene existente; o default dos formulários permanece. `src/features/search/lib/searchDateLabel.ts` apresenta datas sem alterar a URL. TrustList ganha cards no próprio módulo. Testes/stories continuam próximos dos recursos. Não há feature/pasta nova de busca nem cópia da 041. Contratos, responsabilidades, catálogo provisório e validação: [implementação T7](../specs/005-ui-conformance/home-fidelity-implementation.md).

## Busca de cantinhos (spec 041, worktree pethost_frontend-041)

Inventário e interfaces: [design da 041](../specs/041-search/design.md). Implementado nesta branch; mapa T8 fora do escopo. O vault é somente leitura nesta entrega e recebe nota/linhas de catálogo pelo relatório de coordenação.

```text
src/app/(account)/search/             rota privada e teste de auth
src/features/search/
  index.ts, index.client.ts, index.server.ts
  types.ts                           URL e pets de composição
  api/                               schemas e query infinite
    server/                          prefetch exclusivo do servidor
  lib/                               parser, tradução API, copy, selos e erros
  hooks/                             URL, histórico e query
  components/
    SearchScreen.tsx                 RSC + HydrationBoundary
    client/
      SearchExperience.tsx            composição interativa
      SearchBar/                     formulário e painel móvel
      FilterChips/                   filtros na URL
      ListingCard/                   link público e preço
      SearchResults/                 lista, feedback e paginação
src/shared/lib/money/                reais/centavos e formatação
src/shared/lib/date/stayRules.ts     datas de estadia de calendário
src/shared/ui/forms/DateRangeField/  chegada e saída controladas
src/shared/ui/feedback/SniffingBanner/ atualização não bloqueante
src/test/fixtures/search.ts          fixtures sintéticas
src/test/msw/searchMock.int.test.ts  contrato do mock E2E
e2e/support/handlers/search.mjs      busca simulada
e2e/mocked/search/search.spec.ts     jornadas desktop e celular
```

Testes/stories ao lado dos componentes; funções e regras ficam em lib, E/S na API, coordenação no hook. `pets/index.ts` apenas expõe `petQueries` existente para a página compor os pets ativos, sem import entre features. `shared` não conhece os contratos da busca.

## Página do cantinho (spec 042)

`src/app/listings/[listingId]/` contém a rota aberta ao visitante (087; só o pedido, em `(account)/listings/[listingId]/request`, exige conta), que compõe a casca (`AppShell`, com `user` nulo para o visitante) e as features: `HouseResidents` (pets) e `CompatibilityNotice` (busca) entram como slots da `ListingPageScreen`, sem import entre features. `features/listing-page/components/ListingPageScreen.tsx` é a composição server (revisão 078, fiel à prancha); a lateral do tutor é `components/client/StayBookingCard.tsx` e os recados de quem não pede ficam em `components/client/ListingPageActions.tsx`.

```text
src/app/listings/[listingId]/
  page.tsx                              sessão opcional, casca, metadata, avaliações, slots, prefetch/hydration
  page.test.tsx                         metadata e escopo do visitante
  page.int.test.tsx                     visitante sem cookie: só o que é aberto, pedido pelo login
src/features/listing-page/
  api/                                   contratos (detalhe, avaliações), query e carregamento server
  lib/                                   copy, total, fatos da casa, motivos, voltar (searchOrigin)
  components/ListingPageScreen.tsx        detalhe RSC com slots de compatibilidade e residentes
  components/ListingGallery.tsx           galeria com moldura, carrossel no celular e vazio
  components/NightlyPrice.tsx             diária da lateral
  components/client/StayBookingCard.tsx   datas, pets, conta, pedido e barra do celular
  components/client/ListingPageActions.tsx recados do dono e da conta de anfitrião
src/features/search/components/client/CompatibilityNotice/  caixa de compatibilidade da página
src/shared/config/listingBadges.ts        selos do cantinho (códigos e rótulos), fonte única do card e da página
src/test/fixtures/listingPage.ts          detalhe, fotos e avaliações sintéticos
e2e/mocked/search/listing-page.spec.ts   jornada simulada do detalhe
```

## Conversas, interface (spec 055 em rascunho, 23/10/2026)

Interface (também no Storybook, `Conversas/Prévia sem backend`) e rotas `/conversations` e `/conversations/[conversationId]` ligadas à API. Sem o hub de tempo real: a conversa aberta se atualiza a cada 5 s e a lista a cada 15 s. Requisitos e divergências do design: [spec 055](../specs/055-conversations/requirements.md).

```text
src/app/(account)/conversations/
  page.tsx, [conversationId]/page.tsx     sessão, id e composição; testes de metadata
src/features/conversations/
  index.ts, index.client.ts, index.server.ts
  types.ts                                 conversa, mensagem, página por cursor e envio
  api/contracts.ts, mappers.ts             estreita o gerado (sentBy owner/host) e converte
  api/queries.ts                           lista, contador, detalhe e mensagens por cursor, com consulta periódica
  api/client/conversations.client.ts       texto, foto em multipart e marcar como lida
  api/server/conversations.server.ts       detalhe (404 da casca) e prefetch
  hooks/useConversationMutations.ts        envio entra no cache; lida zera o contador
  lib/                                     copy, hora/dia de Brasília, linha do tempo, prévia, bloqueio, limite
  components/client/
    ConversationList/                      lista com prévia, hora e não lidas
    ConversationHeader/                    foto, nome, apoio, selo e voltar no celular
    MessageThread/                         dias, balões, foto com legenda, acontecimentos
    MessageComposer/                       câmera, texto, Enter envia
    MyConversations/                       lista vinda da API (carregando, erro, lista)
src/widgets/conversation-panel/
  index.ts, index.client.ts, index.server.ts
  lib/stayContext.ts                       cantinho, dia da estadia, faixa, chegada; reserva da conversa
  components/client/ConversationPanel/     conversa + contexto da estadia + campo ou bloqueio
  components/client/ConversationRoom/      painel ligado à API (envio, anteriores, lidas)
  components/server/ConversationsScreen/   prefetch da lista, conversa, mensagens e estadia
  components/server/StayBanner/            faixa céu da estadia
  components/server/ConversationsLayout/   duas colunas; no celular, uma por vez
src/features/bookings/index.ts             passa a expor formatPeriod, statusLabel, Booking e BookingStatus
src/shared/config/navigation.ts            atalho Conversas para tutor e anfitrião
src/widgets/app-shell/components/AppHeader.tsx  Conversas também na home do tutor
src/shared/api/errors/errorCopy.ts         códigos CONVERSATION_*
src/test/fixtures/conversations.ts         DTOs sintéticos da prancha
src/test/conversationsPreview.ts           dados mapeados e envio só na memória das stories
src/app/ConversationsPreview.stories.tsx   tela inteira com a casca real
```

O widget compõe `conversations` e `bookings` pelos índices públicos; a feature não conhece a estadia (recebe acontecimentos prontos). `ConversationRoom` e `ConversationsScreen` não têm story: só buscam dados, e o visual está nas stories do painel, do layout e da prévia. E2E simulado pendente (o backend simulado ainda não tem handlers de conversa). Catálogo e notas do vault pendentes: o vault não estava acessível nesta máquina.

## Início público (spec 040, 15/10/2026)

```text
src/app/page.tsx                                  rota pública `/`, sessão e prefetch opcional
src/app/page.int.test.tsx                         sessão, prefetch e falha recuperável
src/widgets/home/
  components/HomeScreen/
    HomeScreen.tsx                                 estados por papel, busca e hero
    HomeScreen.test.tsx                            cobertura funcional
    HomeScreen.stories.tsx                         estados de visitante, conta e celular
    index.ts
  lib/
    homeCopy.ts                                    textos da home
    homeSearchPath.ts, homeSearchPath.test.ts       handoff da busca
  index.ts
e2e/mocked/home/home.spec.ts                       jornadas de navegador desktop e celular
```

`HomeScreen` usa componentes de marca e confiança de `shared`, recebe do servidor apenas sessão reduzida e pets ativos reduzidos, e não chama a API de anúncios. A nota canônica está em `development/resources/home` e o recurso consta no catálogo do vault.

## Pagamentos do anfitrião (spec 043, 15/10/2026)

```text
src/features/host-payouts/
  api/                         contratos, mapper, query e cliente BFF
    client/                    operações browser de sessão, link e sync
    server/                    prefetch autenticado para a rota RSC
  components/client/
    EmbeddedOnboarding/        fronteira Stripe Connect, carregada sob demanda
    HostPayouts/               estados e ações da tela
  components/server/
    HostPayoutsScreen/         prefetch e HydrationBoundary
  hooks/                       início, link hospedado e sincronização
  lib/                         copy, requisitos, appearance e etapa do painel 030
  types.ts                     projeção segura da conta de recebimento
src/app/(host)/host/payments/  rota privada /host/payments
src/test/fixtures/payouts.ts   fixture sintética do DTO
src/test/msw/stripeAccountMock.int.test.ts
e2e/support/handlers/stripeAccount.mjs
e2e/mocked/host/payouts.spec.ts
e2e/support/devIndicator.ts       selo do next dev oculto em jornadas mobile
```

O painel 030 nao foi criado nem alterado; `payoutStageOf` esta exportado como contrato para a integracao paralela. A jornada Playwright cobre desktop e celular. `stripeAccount.mjs` semeia `restricted`/`enabled`; o teste intercepta `connect-js.stripe.com/v1.0/connect.js` com um elemento Connect sintetico, sem rede externa. A execucao aguarda o Renato informar quando as portas estiverem livres.

## Ampliação da base de pets (spec 021, 14/10/2026)

Recursos implementados sobre a feature da 020; componentes, stores e páginas da composição paralela têm inventário próprio. Detalhes e validação no vault `development/resources/pets.md`, seção "Apresentar o pet (spec 021): base".

```text
src/features/pets/
  api/
    mappers.ts                         toPet, toPetList e toCreatePetRequest
    toCreatePetRequest.test.ts
    client/
      petMutations.client.ts
      petMutations.client.int.test.ts
  schemas/
    petProfileSchema.ts
    petProfileSchema.test.ts
  lib/
    species.ts, species.test.ts
    ageBucketToBirthDate.ts, ageBucketToBirthDate.test.ts
    gramsToKg.ts, gramsToKg.test.ts
    normalizeMicrochip.ts, normalizeMicrochip.test.ts
    petDraft.ts, petDraft.test.ts
    petsCopy.ts                        ampliado com fieldErrors
  hooks/
    useCreatePet.ts, useCreatePet.int.test.tsx
    useUploadPetPhoto.ts
src/shared/
  hooks/useSessionDraft.ts, useSessionDraft.test.tsx
  lib/files/fileFingerprint.ts, fileFingerprint.test.ts
  api/client/withSessionRetry.ts, withSessionRetry.int.test.ts
src/test/msw/petsMock.int.test.ts
e2e/support/handlers/pets.mjs           GET, criação e fotos; resetPets
e2e/support/mock-backend.mjs            reset de conta inclui pets
```

Arquivos de teste ficam junto do recurso; o teste dos handlers utiliza MSW no runner de integração existente. Não há validatePhotoFile duplicado, export sem consumidor em index, pasta planejada apresentada como implementada ou jornada Playwright nova nesta camada.

Conferida no disco em 11/10/2026. Excluídos node_modules, .next, storybook-static, .git, .maestri, coverage, playwright-report, test-results e tsconfig.tsbuildinfo (dependências, metadados, caches e relatérios).

Pasta nasce com arquivo, via geradores: npm.cmd run gen:feature -- <nome> e npm.cmd run gen:component -- <camada> <Nome>. Anatomia nas [convenções, seção 2](conventions.md#2-anatomia).

```text
pethost_frontend/
  .github/
    workflows/
      frontend.yml
  .storybook/
    examples/
      Pipeline.stories.tsx
    main.ts
    preview.ts
  docs/
    architecture-review.md
    architecture.md
    conventions.md
    features-and-api.md
    folder-structure.md
    testing-strategy.md
    validation.md
  e2e/
    mocked/
      design-system.spec.ts
      smoke.spec.ts
    real/
      README.md
    support/
      mock-backend.mjs
  openapi/
    pethost.v1.json
  plop-templates/
    component-implementation.hbs
    component-index.hbs
    component-story.hbs
    component-test.hbs
    feature-client.hbs
    feature-neutral.hbs
    feature-server.hbs
    naming.mjs
    README.md
    templates.test.ts
  public/
    animations/
    brand/
      turma/
        corgi.webp
        golden.webp
        pastor.webp
    fonts/
    images/
      brand/
      illustrations/
    file.svg
    globe.svg
    next.svg
    vercel.svg
    window.svg
  scripts/
    api-check.mjs
    api-sync.mjs
    openapi-transformer.mjs
    openapi-transformer.test.ts
  specs/
    _templates/
      design.md
      requirements.md
      tasks.md
    001-tooling-and-quality/
      design.md
      requirements.md
      tasks.md
    002-design-system/
      design.md
      requirements.md
      tasks.md
    003-http-and-session/
      design.md
      requirements.md
      tasks.md
    010-login/
      design.md
      requirements.md
      tasks.md
    README.md
    roadmap.md
  src/
    app/
      favicon.ico
      globals.css
      layout.tsx
      page.module.css
      page.tsx
    assets/
      fonts/
        atkinson-hyperlegible-next-latin-400-italic.woff2
        atkinson-hyperlegible-next-latin-400-normal.woff2
        atkinson-hyperlegible-next-latin-700-normal.woff2
        AtkinsonHyperlegibleNext-OFL.txt
        caprasimo-latin-400-normal.woff2
        Caprasimo-OFL.txt
    shared/
      api/
        contracts/
          envelope.test.ts
          envelope.ts
        errors/
          ApiError.test.ts
          ApiError.ts
        generated/
          audit-entries/
            audit-entries.zod.ts
          host-applications/
            host-applications.zod.ts
          host-pets/
            host-pets.zod.ts
          host-profile/
            host-profile.zod.ts
          hosts/
            hosts.zod.ts
          hosts-admin/
            hosts-admin.zod.ts
          owners/
            owners.zod.ts
          password/
            password.zod.ts
          pets/
            pets.zod.ts
          sessions/
            sessions.zod.ts
          users/
            users.zod.ts
          index.zod.ts
        transport/
          fetchTransport.int.test.ts
          fetchTransport.test.ts
          readApiResponse.test.ts
      config/
        env.server.test.ts
        env.server.ts
      theme/
        tokens/
          colors.test.ts
          colors.ts
          contrast.test.ts
          typography.test.ts
    test/
      a11y/
        contrastRatio.test.ts
        contrastRatio.ts
      architecture/
        fixtures/
          app/
            page.tsx
          features/
            alpha/
              api/
                server/
                  alpha.server.ts
              components/
                client/
              lib/
                internal.ts
              index.ts
            beta/
              index.ts
          shared/
            util.ts
          widgets/
            one/
              index.ts
            two/
              index.ts
        boundaries.test.ts
      msw/
        server.ts
        unhandled.int.test.ts
      setup/
        server-only.stub.ts
        vitest.setup.ts
      render.test.tsx
      render.tsx
  .env.example
  .gitignore
  .prettierignore
  .prettierrc.json
  AGENTS.md
  eslint.config.mjs
  next-env.d.ts
  next.config.ts
  orval.config.ts
  package-lock.json
  package.json
  playwright.config.ts
  plopfile.mjs
  README.md
  tsconfig.json
  vitest.config.mts
  vitest.storybook.config.ts
```

Features, widgets e bootstrap de produção ainda ausentes. Diretórios homônimos dentro de src/test/architecture/fixtures são dados de teste. Generated contém schemas, não transporte HTTP.

## Adições da spec 013 (recuperação de senha)

Responsabilidades preservadas: `shared/lib/url` concentra funções puras de URL; `shared/hooks` faz a ponte com o estado React e as APIs do navegador; `shared/api/contracts` guarda contratos de resposta que não são de auth; `features/auth` ganha schemas, cliente HTTP, mutações, telas e copy da recuperação. `e2e/mocked/auth` agrupa a jornada no navegador, com backend simulado.

```text
e2e/
  mocked/auth/password.spec.ts
  support/handlers/password.mjs
  support/hydration.ts
src/app/(auth)/
  forgot-password/page.tsx, page.test.ts
  reset-password/page.tsx, page.test.ts
src/features/auth/
  api/client/password.client.ts, password.client.int.test.ts
  components/PasswordScreen.tsx
  components/client/
    ForgotPasswordFlow.tsx, ForgotPasswordFlow.test.tsx
    ForgotPasswordForm.tsx, ResetLinkSent.tsx
    ResetPasswordFlow.tsx, ResetPasswordFlow.test.tsx
    ResetPasswordForm.tsx, StepHeading.tsx, ErrorNotice.tsx
  hooks/
    usePasswordMutations.ts, usePasswordMutations.int.test.tsx
    useErrorNotice.ts, useErrorNotice.test.tsx
  lib/passwordCopy.ts
  schemas/
    forgotPasswordSchema.ts, forgotPasswordSchema.test.ts
    resetPasswordSchema.ts, resetPasswordSchema.test.ts
src/shared/
  api/contracts/emptyData.ts
  hooks/useUrlSecret.ts, useUrlSecret.test.tsx
  lib/url/readSecretFromUrl.ts, readSecretFromUrl.test.ts
```

Recursos, uso e cobertura de cada peça na nota `development/resources/auth.md` do vault.

## Ampliação de pets da casa (spec 023, 14/10/2026)

A slice existente pets atende owner/host. Não há nova rota ou widget de onboarding: `(account)` já aceita os dois papéis. O bloqueio é resposta do módulo Pets. Recursos e responsabilidades na nota `development/resources/pets.md` do vault (seção "Pets da casa e vitrine de residentes").

```text
src/features/pets/
  api/invalidatePetLists.ts                 invalidação de mine e vitrine pelo id do perfil
  api/petQueries.int.test.ts                isolamento e projeção pública do cache
  api/toHouseResidents.test.ts              mapper público sem campos privados
  api/server/houseResidents.server.ts       prefetch autenticado, não bloqueante
  components/MyPetsScreen.stories.tsx       composição host/vazio/pendente
  components/client/HouseResidents/         vitrine client, tests, integração, story, index
  components/client/KeeperPendingNotice/    aviso server-safe, tests, story, index
  components/client/PetWelcome.stories.tsx  boas-vindas por papel
  lib/isKeeperPending.ts                    reconhecimento do erro de perfil ausente
  lib/coexistenceSummary.ts                 frase de convivências positivas
  lib/petsCopy.test.ts                      paridade do copy owner/host
  api/contracts.ts                         hostPetsSchema e HostPetsResponse
  api/mappers.ts                           toHouseResidents e hostId de toPetList
  api/queries.ts                           petQueries.house
  types.ts                                 HouseResident e PetList.hostId
  index{,.client,.server}.ts                APIs públicas por ambiente
src/app/(account)/pets/{page,new/page}.tsx  papel, metadata e preflight host
src/shared/config/navigation.ts            host-pets disponível
src/shared/api/errors/errorCopy.ts          PET_HOST_NOT_FOUND
src/test/msw/petsMock.int.test.ts           mock host aprovado/pendente e vitrine

e2e/mocked/pets/host-pets.spec.ts           duas jornadas, desktop/celular pelo runner

e2e/real/pets/host-pets.spec.ts             jornada do seed aprovado, condicional
```

Queries/DTOs ficam em api; strings e funções puras em lib; acesso/prefetch em api/server; efeitos de cache nos hooks e no helper api/invalidatePetLists; apresentação nos componentes existentes e nas duas pastas novas geradas pelo Plop. Não há diretório planejado apresentado como implementado.

## Spec 031: fila administrativa (15/10/2026)

Implementada na worktree `pethost_frontend-031`, branch `feat/031-admin-verification-queue`. A API continua como fonte do contrato. O vault permanece somente leitura nesta entrega; o conteúdo para catálogo e notas será enviado ao responsável pela integração.

```text
src/app/(admin)/admin/(panel)/host-applications/
  page.tsx                         autorização, filtros e prefetch da fila
  [applicationId]/page.tsx         autorização, UUID e prefetch do detalhe
src/features/admin-host-applications/
  api/contracts.ts                 schemas derivados do gerado, tipos locais do admin
  api/client/adminApplications.client.ts
  api/server/adminApplications.server.ts
  api/queries.ts                   cache por conta; não inclui links de fotos
  schemas/reviewSchemas.ts          filtros, aprovação, recusa e confirmação de fraude
  hooks/useDecision.ts             decisão, invalidação e recuperação de conflito
  components/ApplicationQueue.tsx  lista, filtro e paginação
  lib/adminReviewCopy.ts            rótulos do admin e prévia do e-mail real
  index.ts, index.client.ts, index.server.ts
src/widgets/host-application-review/
  components/ApplicantComparison.tsx
  components/DecisionPanel.tsx      inclui checklist local PF/PJ
  components/HostApplicationReview.tsx
  components/SignedDocumentViewer.tsx
  index.client.ts
src/shared/lib/pagination/paginate.ts
src/shared/hooks/useSearchParamsState.ts
src/shared/ui/data-display/AdminDataTable/
  AdminDataTable.tsx, AdminDataTable.test.tsx, AdminDataTable.stories.tsx, index.ts
src/shared/ui/forms/ReasonField/
  ReasonField.tsx, ReasonField.test.tsx, ReasonField.stories.tsx, index.ts
src/test/fixtures/adminApplications.ts
src/test/msw/adminApplicationsMock.int.test.ts
e2e/support/handlers/adminApplications.mjs
e2e/mocked/admin/verification-queue.spec.ts
e2e/real/admin/verification-queue.spec.ts
```

Os testes unitários, funcionais e de integração ficam junto dos recursos. Cada componente novo tem story, incluindo estados de empresa, decisão, fotos apagadas, conflito e celular. O checklist não tem export separado: sua cobertura pertence a `DecisionPanel.test.tsx`. `DecisionSummary` é interno e coberto pela composição e story de solicitação decidida. Não há dependência da feature da spec 030. `shared` não conhece o domínio de verificação; o widget compõe o domínio usando as APIs públicas da feature. Links assinados não entram no prefetch, no Query ou na URL da página.

## Spec 033: auditoria administrativa (15/10/2026)

Implementação na worktree `pethost_frontend-033`, branch `feat/033-admin-audit`. O domínio fica isolado em `features/admin-audit`; `AuditTable` é exportada para composição compacta pela 032. Reutiliza `AdminDataTable`, `useSearchParamsState` e `paginate` da 031. O ajuste de URL remove filtros opcionais solicitados e preserva parâmetros alheios.

```text
src/app/(admin)/admin/(panel)/audit-entries/page.tsx
src/features/admin-audit/
  api/contracts.ts, mappers.ts, queries.ts
  api/client/audit.client.ts, audit.client.int.test.ts
  api/server/audit.server.ts, audit.server.int.test.ts
  schemas/auditSearchSchema.ts, lib/{toAuditQuery,auditActionCopy,auditTargetLink,auditCopy}.ts
  components/client/{AuditExplorer,AuditFilters,AuditTable,AuditEntryDetail}/
src/shared/lib/date/formatDateTime.ts
src/shared/ui/data-display/CopyButton/
src/test/fixtures/audit.ts
e2e/support/handlers/auditEntries.mjs
e2e/mocked/admin/audit.spec.ts, e2e/real/admin/audit.spec.ts
```

O detalhe mantém o IP fora da tabela; IDs e traceId são copiados ou navegados apenas por ação do usuário. `details` segue o OpenAPI como mapa texto-texto. E2E foi escrito, mas não iniciado aguardando portas reservadas. Catálogo e notas do vault ficam para integração fora desta worktree; as linhas de recurso seguem no resumo.

### Integração da trilha nos detalhes 032 (15/10/2026)

```text
src/app/(admin)/admin/(panel)/users/owners/[ownerId]/page.tsx  compõe AuditTable com alvo owner fixo
src/app/(admin)/admin/(panel)/users/hosts/[hostId]/page.tsx    compõe AuditTable com alvo host fixo
src/app/(admin)/admin/(panel)/users/accountAuditComposition.stories.tsx  story da composição no nível app
src/widgets/admin-accounts/components/AccountDetail.test.tsx   slot e link filtrado para tutor/anfitrião
e2e/mocked/admin/accounts.spec.ts                              jornada conta → trilha para os dois alvos
```

As rotas compõem `AuditTable` pelo índice público `features/admin-audit/index.client.ts` e passam o nó pelo `auditTrail`; `widgets/admin-accounts` não importa a feature. O mock mantém eventos sintéticos para ids de tutor e anfitrião e registra ambos os handlers e resets em `mock-backend.mjs`. A primeira coluna do diretório de contas já traz o texto visível do nome, então não fornece `rowLabel` redundante ao `AdminDataTable` atualizado.

## Avatar humano compartilhado (076)

```text
src/shared/ui/media/InitialsAvatar/
  InitialsAvatar.tsx           foto opcional, fallback Unicode e cores AA
  InitialsAvatar.test.tsx      erro da imagem retorna ao fallback
  InitialsAvatar.stories.tsx   estados, tamanhos e comparação coral/café
  index.ts                    API pública do componente e props
src/shared/lib/text/initials.ts regra pura de extração de iniciais
```

A pasta media contém apresentação; parsing continua em shared/lib/text e cores em shared/theme/tokens/semantic.ts. AccountMenu, PublicProfileCard, HostBookingList, AvatarUploader, ListingCard e ListingPageScreen compõem o recurso; ele não conhece conta, reserva ou API. Detalhes: [076](../specs/076-avatar-initials/design.md).

## Revisão 071 da busca

SearchBar em features/search/components/client/SearchBar centraliza a faixa usada por home, /search e detalhe. searchDateLabel e seus testes migram de widgets/home/lib para features/search/lib; não há pasta vazia ou cópia residual. HomeScreen compõe o recurso pelo index.client público.

## Modalidade de entrada e foco (081)

```text
src/shared/theme/focus.ts                  seletor keyboardFocus, geometria focusRing e atributo
src/shared/hooks/useInputModality.ts       listeners documentais sem estado React
src/shared/hooks/useInputModality.test.tsx cleanup do efeito
```

ThemeProviders instala o hook no topo do app; o decorator existente de .storybook/preview.ts instala o mesmo efeito nas stories. Nenhum provider/contexto/store novo. Overrides e consumidores usam o helper do tema; o antigo export focusRing de overrides/Button.ts foi movido para theme/focus.ts com todos os imports migrados. Detalhes e validação: [081](../specs/081-keyboard-only-focus/design.md).

GlobalError, fronteira alternativa que substitui o layout sem MUI/providers, instala o mesmo hook e usa o helper/geometry para CSS nativo. Não há segundo tracker simultâneo na árvore normal; detalhes em frontend-input-modality.

## Revisão 074 do cadastro

RegisterChoiceScreen foi removido; /register compõe RegistrationScreen owner diretamente. RegisterChoice permanece interno ao wizard como cartões de troca de papel. Stories de RegistrationScreen cobrem composição do wizard/PersonStep; stories de RegisterChoice cobrem as opções. Nenhuma store/provider/pasta nova. WizardProgress e PasswordStrengthChecklist foram estendidos nas pastas existentes. Fonte técnica: [cadastro fiel](../specs/005-ui-conformance/register-fidelity-implementation.md).

## Conteúdo do rodapé (093)

`src/shared/config/contact.ts` mantém os canais públicos aprovados, tipados e sem transporte HTTP. `shared/ui/brand/GrassFooter/grassFooterCopy.ts` mantém textos e destinos do rodapé; sem diretórios técnicos novos. Interface, consumo, limites e testes: `specs/005-ui-conformance/footer-content-implementation.md`.

Revisão da 093: sem diretórios novos. GrassFooter recebe accountRole da sessão na home/AppShell e usa NAV_ITEMS para atalhos pessoais. DoorMark aceita wordmarkColor, com uso real na assinatura em papel do footer. soilContent removido; soilDeep atende onda e textos, sem painel separado. Fonte: `specs/005-ui-conformance/footer-content-implementation.md`.

## Novidades de estadias (100)

`shared/lib/seenSnapshots.ts` contém adapter IndexedDB nativo opaco; `features/bookings/lib/stayUpdates.ts` mantém assinatura/comparação de domínio e `hooks/useStayUpdates.ts` coordena cache e reconhecimento. `widgets/app-shell/components/client/OwnerHeaderNav.tsx` é a ilha do tutor composta por AppHeader; HeaderNav segue apresentacional. Testes adjacentes e HeaderNav.stories.tsx. Sem novas pastas técnicas, providers ou stores. Interfaces e limites em [spec 100](../specs/100-stays-update-dot/implementation.md).

## Cantinho em passos (104)

O cadastro novo do cantinho é um assistente em passos na casca `StepWizard`; a edição continua em seções. Campos compartilhados em `fields/`; peças visuais reutilizáveis em shared. Detalhes: [104](../specs/104-cantinho-em-passos/design.md).

```text
src/features/host-listings/
  components/client/
    ListingDraft.tsx               assistente de 9 passos (rascunho com o passo)
    ListingPreview.tsx             card do cantinho ao vivo
    ListingReview.tsx              Confere e abre: blocos com Editar
    ListingSections.tsx            seções da edição, com os mesmos campos
    fields/                        HomeFields, HouseholdFields, GuestsFields, StayFields, ListingYesNo, HomeIllustration
    sections/ListingSectionHost.tsx  seção com Salvar (só edição)
  lib/listingSteps.ts, listingSummary.ts
  schemas/listingResolver.ts
src/shared/ui/forms/CheckCardGroup/        escolha múltipla em cartões
src/shared/ui/data-display/ListingCardFace/ cara do card do cantinho (+ AttributeIcon, vindo da busca)
```

Saíram `ListingSectionsPanel.tsx` e `sections/{HomeSection,HouseholdSection,GuestsSection,SimpleSections}.tsx`.

### 110: PetAvatar

`src/shared/ui/media/PetAvatar/`: PetAvatar.tsx (SVGs inline), index.ts (API), PetAvatar.test.tsx, PetAvatar.stories.tsx e ARTWORK-LICENSE.md. Sem pasta de assets: geometria compartilhada em SVG inline. Spec: `specs/110-avatar-do-pet/{requirements,design,tasks,validation}.md`.

## Fotos por arraste (106)

PhotoSlots permanece em `src/shared/ui/media/PhotoSlots/`, com componente, copy, index, testes e stories existentes. Novo teste da composição: `src/features/host-listings/components/client/ListingPhotosSection.int.test.tsx`. Spec real `specs/106-fotos-arrastar/{requirements,design,tasks,validation}.md`. Sem nova pasta técnica, store ou provider. Prints são relatórios em test-results/106, fora da árvore autoral.
