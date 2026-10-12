# Frontend PetHost

Siga as regras compartilhadas em [../AGENTS.md](../AGENTS.md).

Antes de implementar, consulte no vault:

- `../PetHost obsidian/PetHost obsidian/development/documentation-policy.md`
- `../PetHost obsidian/PetHost obsidian/development/resource-catalog.md`
- `../PetHost obsidian/PetHost obsidian/development/frontend-folder-responsibilities.md`

Cada componente e recurso deve ser documentado no Obsidian na mesma entrega; recursos reutilizáveis entram no catálogo. Pastas vazias são planejamento, não implementações disponíveis para reutilização.

Todo comportamento desenvolvido exige testes adequados, conforme `../PetHost obsidian/PetHost obsidian/development/testing-policy.md` e `frontend-testing-strategy.md`. Unitários/componentes/integração usarão Vitest/Testing Library/MSW; jornadas usarão Playwright. Os níveis não aplicáveis precisam de justificativa explícita. Consulte a estratégia antes de implementar helpers e fixtures, documentando os reutilizáveis no catálogo.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
