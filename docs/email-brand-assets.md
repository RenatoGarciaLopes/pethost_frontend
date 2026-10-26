# Marca pública dos e-mails

Atualizado em 28/10/2026. `public/fonts/` contém os mesmos quatro arquivos WOFF2 usados por `src/app/layout.tsx` via `next/font/local`, com as duas licenças OFL. Foram movidos de `src/assets/fonts/`, sem cópia duplicada. Caprasimo 400 é a fonte de títulos/marca; Atkinson Hyperlegible Next 400/700 é a fonte do corpo/botões. A versão itálica continua consumida pelo site. `/fonts/:path*` tem CORS público em `next.config.ts` para clientes de e-mail carregarem esses assets sem cookies. As rotas privadas não recebem essa permissão.

`public/brand/email-logo.png` é a assinatura porta + pethost, rasterizada em 3x (exibição 177×52), com fundo transparente e nome acessível no HTML do backend. A imagem preserva Caprasimo em clientes como Gmail que não carregam webfonts. Não transforma corpo ou CTA em imagem: texto continua selecionável, acessível e funciona quando imagens são bloqueadas. Layout mantém contraste e fallbacks locais.

## Geração e consumidores

`npm run brand:email-logo` executa `scripts/generate-email-logo.mjs`: lê os paths/círculo do `DoorMark.tsx`, cores de `tokens/colors.ts` e a Caprasimo pública; usa Playwright/Chromium já instalado, fonte local interceptada sem rede e falha se a construção da marca mudar. Não cria logo alternativa. Reexecutar ao mudar DoorMark, cores ou fonte. A exportação usa os parâmetros da assinatura de cabeçalho (40×44, traço 8, maçaneta 4,5). Não exporta helpers internos.

O backend `EmailTemplate` referencia `/brand/email-logo.png` e três fontes normais de `/fonts/` usando a origem de `EMAIL_APP_URL`. Publicar esses arquivos no frontend antes de ativar o novo template no backend. Endereço indicado pelo usuário: `https://pethost.vercel.app`. As fontes declaradas nos e-mails usam fallback porque suporte a `@font-face` depende do cliente; não prometer a mesma renderização no Gmail/Outlook. Logo usa PNG para ser independente desse suporte.

## Validação

`scripts/email-brand-assets.test.ts` cobre arquivos WOFF2 usados pelo layout, PNG em alta resolução, CORS de fontes e preservação de Referrer-Policy da página de senha. A geração real com Chromium confirmou carregamento de Caprasimo, paths e imagem; imagem inspecionada. Testes do backend cobrem as URLs de assets e não vazamento de token para fontes/logo. Limitações: Gmail/Outlook reais e deploy público ainda não validados; nenhuma credencial foi alterada.

Verificações executadas: `npm run typecheck` e ESLint/Prettier dos arquivos alterados aprovados; `node node_modules/vitest/vitest.mjs run --project=unit --pool=threads --maxWorkers=1 scripts/email-brand-assets.test.ts`: 3 testes aprovados. Inspeção visual de cinco e-mails no Chromium carregando logo e fontes locais; sem overflow em 390 px. Testes de integração SMTP/banco permanecem no backend e exigem Docker; não foram executados. E2E de aplicação não é necessário para arquivos estáticos, mas validação pública de assets e clientes reais de e-mail permanece pendente após deploy.

`npm run build` aprovado (Next 16.4.2/Turbopack, 52 páginas geradas), incluindo a compilação de `next/font/local` com os novos caminhos. Não significa deploy na Vercel.
