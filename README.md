# PetHost Frontend

Next App Router, React, TypeScript, MUI/Emotion, TanStack Query, Zustand e RHF/Zod. Spec 001 concluída em 11/10/2026, D1 a D6 aprovadas pelo Renato. Home scaffold; tema Quintal (002), transporte/sessão/BFF (003) e telas de produto futuros.

[Arquitetura](docs/architecture.md), [árvore real](docs/folder-structure.md), [features/API](docs/features-and-api.md), [testes](docs/testing-strategy.md), [validação](docs/validation.md), [decisões](docs/architecture-review.md), [convenções](docs/conventions.md) e [specs](specs/README.md).

Fonte técnica única no repositório: docs, specs, TSDoc e stories. Vault guarda índice/catálogo; notas longas para shared/widgets. Consulte [AGENTS.md](AGENTS.md), [política](<../PetHost obsidian/PetHost obsidian/development/documentation-policy.md>) e [catálogo](<../PetHost obsidian/PetHost obsidian/development/resource-catalog.md>).

## Comandos

Executar em pethost_frontend, Node 24. No PowerShell use npm.cmd/npx.cmd. Instale com npm.cmd ci --ignore-scripts, respeitando allow-scripts, sem contornar configurações; depois npm.cmd run dev. App: http://localhost:3000.

| Script (npm.cmd run ...) | Uso                              |
| ------------------------ | -------------------------------- |
| dev                      | Next dev, porta 3000             |
| build                    | Build Next                       |
| start                    | Next produção                    |
| lint                     | ESLint e fronteiras              |
| typecheck                | TypeScript sem emissão           |
| format                   | Prettier escreve                 |
| format:check             | Prettier confere                 |
| test                     | Todos os projetos Vitest         |
| test:unit                | Unitários Node                   |
| test:component           | Componentes jsdom                |
| test:integration         | Integração Node e DOM            |
| test:watch               | Vitest watch                     |
| test:coverage            | Cobertura v8                     |
| test:e2e                 | Playwright padrão simulado       |
| test:e2e:mocked          | Desktop/mobile simulados         |
| test:e2e:real            | Desktop com API real obrigatória |
| storybook                | Storybook, porta 6006            |
| storybook:build          | Build Storybook                  |
| storybook:test           | Stories e a11y no Chromium       |
| gen:feature              | Plop feature                     |
| gen:component            | Plop componente                  |
| verify                   | Formatação, lint, tipos e Vitest |
| api:sync                 | Baixa OpenAPI e gera             |
| api:generate             | Gera Zod local                   |
| api:check                | Regera e compara                 |

Testes: npm.cmd run verify e npm.cmd run test:coverage. Para navegador, npx.cmd playwright install chromium e npm.cmd run test:e2e:mocked. Storybook: npm.cmd run storybook (6006), storybook:test e storybook:build. verify não inclui browsers; CI escrito não executado.

Contratos: npm.cmd run api:sync baixa e gera; api:generate gera do snapshot local; api:check detecta divergência. API .NET em http://localhost:5038 (dotnet run) ou http://localhost:8080 (Docker), prefixo /api/v1. api:sync usa BACKEND_URL, padrão 8080, com API em Development. .env.example usa 5038. Atrás do BFF, ForwardedHeaders__Enabled=true na API. getServerEnv valida na primeira leitura, não por hook automático de subida.

E2E simulado sobe Next 3100 e backend Express/MSW 5099. Real exige API iniciada e BACKEND_URL ou E2E_BACKEND_URL; ainda não há jornadas reais, então falha por ausência de testes. Consulte [instruções](e2e/real/README.md); execute modos separados e reinicie servidores ao trocar backend.

Pasta nasce com arquivo: gen:feature -- <nome> e gen:component -- <camada> <Nome>. Testes ao lado do código, apoio em src/test, jornadas em e2e na raiz. Não criar pastas vazias.
