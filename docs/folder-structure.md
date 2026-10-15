# Estrutura real do frontend

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
```

O painel 030 não foi criado nem alterado; `payoutStageOf` está exportado como contrato para a integração paralela. A suíte Playwright da jornada será escrita e executada depois de o Renato informar as portas de teste.

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
