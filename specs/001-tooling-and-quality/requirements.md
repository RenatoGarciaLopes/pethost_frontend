---
spec: 001-tooling-and-quality
status: done
updated: 2026-10-11
area: TOOL
---

# 001 · Ferramentas e qualidade

## Contexto

O desenvolvimento será feito por agentes de IA em ciclos de TDD. Antes da primeira tela, o repositório precisa de três coisas:

- **barrar sozinho** o que as convenções proíbem (fronteiras, contratos desatualizados, teste faltando);
- dar ao agente **um comando** que diz se a tarefa está pronta;
- servir de documentação viva dos componentes.

Hoje existem só lint, typecheck e build, sem nenhum runner de teste.

## Referências

- [Revisão da arquitetura](../../docs/architecture-review.md), decisões D1 a D6.
- [Convenções](../../docs/conventions.md).
- Vault: `development/testing-policy.md`, `development/frontend-testing-strategy.md`.
- API: OpenAPI de desenvolvimento em `${BACKEND_URL}/openapi/v1.json`.

## Histórias

- Como agente, quero um `npm run verify` que responda "pronto ou não" para não declarar entrega sem prova.
- Como Renato, quero que fronteiras de arquitetura quebradas falhem no CI, não na revisão.
- Como agente, quero contratos gerados da API para não inventar DTOs.
- Como designer ou revisor, quero ver cada componente em todos os estados sem subir o app.

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-TOOL-001 | O SISTEMA DEVE ter quatro projetos Vitest: `unit` (ambiente node, `**/*.test.ts`), `component` (jsdom, `**/*.test.tsx`) e `integration` (node, `**/*.int.test.ts`) e `integration-dom` (jsdom, `**/*.int.test.tsx`), cada um com um script próprio (`test:unit`, `test:component`, `test:integration`) |
| REQ-TOOL-002 | QUANDO um teste faz uma requisição HTTP sem handler MSW, O SISTEMA DEVE falhar o teste com a URL na mensagem                                                                                                                                                                                           |
| REQ-TOOL-003 | O SISTEMA DEVE oferecer `renderWithProviders` (tema MUI, QueryClient novo por teste sem retry, cache Emotion isolado) em `src/test/` (builders sintéticos entram com recursos de produto)                                                                                                              |
| REQ-TOOL-004 | QUANDO não houver nenhum teste para executar, O SISTEMA NÃO DEVE retornar sucesso (`passWithNoTests` desligado)                                                                                                                                                                                        |
| REQ-TOOL-005 | O SISTEMA DEVE medir cobertura de `src/features`, `src/shared` e `src/widgets` e falhar abaixo de 80% global de linhas, ramos, funções e statements nas camadas incluídas, com exclusões em vitest.config.mts                                                                                          |
| REQ-TOOL-006 | QUANDO um arquivo de `features/a` importar `features/b`, `shared` importar uma camada acima, um widget importar outro widget, ou um arquivo `'use client'` importar `api/server` ou `server-only`, O SISTEMA DEVE falhar o lint com a regra violada                                                    |
| REQ-TOOL-007 | QUANDO alguém importar o interior de uma slice de fora dela (sem passar pelo `index*`), O SISTEMA DEVE falhar o lint                                                                                                                                                                                   |
| REQ-TOOL-008 | O SISTEMA DEVE gerar tipos e schemas Zod da API em `src/shared/api/generated/` a partir de `openapi/pethost.v1.json` (`npm run api:generate`) e atualizar esse arquivo do backend local (`npm run api:sync`)                                                                                           |
| REQ-TOOL-009 | SE o código gerado estiver diferente do que o `openapi/pethost.v1.json` versionado produziria, O CI DEVE falhar                                                                                                                                                                                        |
| REQ-TOOL-010 | O SISTEMA DEVE ter Playwright com os projetos `mocked-desktop`, `mocked-mobile` (390 × 844) e `real-desktop`, com trace, screenshot e vídeo só em falha, e o backend simulado subindo sozinho para os projetos `mocked-*`                                                                              |
| REQ-TOOL-011 | O SISTEMA DEVE ter Storybook com tema Quintal previsto na 002, o addon de acessibilidade e as stories executáveis como testes (addon Vitest), e um decorator que alterna computador e celular                                                                                                          |
| REQ-TOOL-012 | O SISTEMA DEVE oferecer `npm run gen:feature -- <nome>` e `npm run gen:component -- <camada> <Nome>`, que criam os arquivos da anatomia (implementação, teste falhando, story, index, TSDoc com campos a preencher)                                                                                    |
| REQ-TOOL-013 | `npm run verify` DEVE executar formatação (checagem), lint, typecheck e os 4 projetos Vitest, e sair com código diferente de 0 se qualquer etapa falhar                                                                                                                                                |
| REQ-TOOL-014 | O CI DEVE rodar em pull request: `verify`, `api:check`, `build`, Storybook test e Playwright `mocked-*`                                                                                                                                                                                                |
| REQ-TOOL-015 | O SISTEMA DEVE validar as variáveis de ambiente do servidor na primeira leitura de getServerEnv, com mensagem que diga qual variável falta                                                                                                                                                             |

## Fora do escopo

- Testes de produto: entram com cada spec de tela.
- Cobertura do backend.
- Ambiente de teste real com a API .NET e o banco: a 001 só deixa o projeto `real-desktop` configurado e documentado.

## Registro da entrega (2026-10-11)

001 done; D1 a D6 aprovadas por Renato. Implementação tem quatro projetos: unit, component, integration (Node) e integration-dom (jsdom); test:integration reúne os dois últimos. Tema Quintal na 002; builders de produto ainda não existem. Ambiente validado na primeira leitura por getServerEnv, não em hook de subida. Cobertura global 80% em linhas/ramos/funções/statements, com exclusões em vitest.config.mts. Client restrito por paths/sufixos convencionais. Contratos via Zod/z.infer, sem transporte gerado. gen:component recebe <camada> <Nome> separados. CI escrito, não executado; critério de execução de PR não verificado. [Resultados](../../docs/validation.md).
