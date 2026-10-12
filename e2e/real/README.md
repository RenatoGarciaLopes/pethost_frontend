> Atualização 11/10/2026: registros abaixo preservam falhas iniciais; vault publicado e browsers/build aprovados pelo Claude Code conforme [validation](../../docs/validation.md). Jornadas reais e tema continuam futuros.

# E2E contra a API .NET

Use uma API .NET de teste já iniciada. Exemplo no PowerShell, sem credenciais:

```powershell
$env:E2E_REAL = '1'
$env:E2E_BACKEND_URL = 'http://localhost:5090'
$env:E2E_BACKEND_API_PREFIX = '/api/v1'
$env:E2E_BASE_URL = 'http://localhost:3100'
npm.cmd run test:e2e:real
```

`BACKEND_URL` também é aceito como origem da API. O Next local usa a porta
3100; `E2E_BASE_URL` deve apontar para esse servidor ou para um frontend de teste
já iniciado. Reinicie servidores existentes antes de trocar o backend:
`reuseExistingServer` não altera o ambiente de processos já em execução.
O projeto real não inicia o backend simulado. Não há jornadas reais nesta etapa;
sem arquivos `*.spec.ts`, o Playwright retorna falha por ausência de testes.
Execute projetos reais e simulados em comandos separados, pois o Next usa uma
única origem de backend por processo. `test:e2e` executa os projetos disponíveis
no modo simulado; use o script específico para jornadas reais.

## Registro provisório de recursos (REQ-TOOL-010/011)

O vault Obsidian está fora da área de escrita permitida. Esta seção registra
provisoriamente a entrega; permanecem pendentes a nota de recursos, o catálogo
e as responsabilidades de pastas no vault.

- `playwright.config.ts`: projetos desktop/mobile simulados e desktop real;
  interface por variáveis E2E acima; relatórios list/HTML e artefatos em falha.
- `e2e/support/mock-backend.mjs`: Express + middleware MSW, porta 5099,
  GET `/health` retorna `{ok:true}`. Somente suporte a testes; não simula
  contratos de produto. Reutilização de `src/test/msw` depende de loader TS.
- `e2e/mocked/smoke.spec.ts`: verifica resposta HTTP bem-sucedida da home
  e título PetHost nos dois viewports. Não prova integração com a API real.
- `.storybook/main.ts`: descoberta de stories de src e exemplos, framework
  Next/Vite e addons a11y/docs/Vitest.
- `.storybook/preview.ts`: layout padded, a11y em modo error e viewports
  desktop 1440x960/celular 390x844. Tema Quintal entra na spec 002.
- `.storybook/examples/Pipeline.stories.tsx`: botão inline temporário,
  sem props nem estado; story verifica papel e rótulo acessível. Remover na 002 T12.
- `vitest.storybook.config.ts`: runner separado para stories no Chromium
  headless, sem alterar a configuração Vitest dos demais agentes.

Dependências: pacotes já instalados de Playwright, Storybook, Vitest browser,
Express e MSW. Scripts públicos estão na seção scripts do package.json.
Não há regras puras para testes unitários separados. O botão trivial é coberto
pela story funcional e a11y; não exige jornada própria no app. Integração de
produto/API real é N/A nesta etapa; a execução dos servidores e runners valida
a integração da infraestrutura. As saídas reais de validação serão registradas
abaixo; build não substitui teste de comportamento.

## Validação real desta entrega

- Vermelho inicial: `npx.cmd playwright test e2e/mocked/smoke.spec.ts` falhou
  (`1 failed`, `Executable doesn't exist` para chromium_headless_shell-1248).
- `npm.cmd run test:e2e:mocked`: servidores iniciados e `Running 2 tests using
2 workers`; mocked-desktop e mocked-mobile falharam ao iniciar Chromium
  (`Executable doesn't exist`). Processo interrompido após ficar pendente no
  encerramento; código final 1. Nenhuma assertion de página foi executada.
- `npx.cmd playwright install chromium`: falhou com EPERM no cache padrão.
  Nova tentativa com `PLAYWRIGHT_BROWSERS_PATH` em TEMP falhou com
  `connect EACCES` para o CDN; navegador não instalado.
- `npm.cmd run storybook:test`: config carregada e `Test Files (1)`, mas
  `Tests no tests`, `Errors 1 error`: Chromium ausente; código 1.
- `npm.cmd run storybook:build`: presets carregados, falha ao construir manager
  (`Cannot read directory "../../..": Acesso negado`, bundles não resolvidos);
  código 1. Não há build aprovado.
- `npx.cmd tsc --noEmit --incremental false`: passou, código 0.
- Prettier aplicado somente aos oito arquivos técnicos/documentais desta tarefa;
  package.json teve somente as seis chaves de scripts pedidas acrescentadas.

Após autorização da exceção, main/preview e as configurações Playwright/Vitest
usam export default. A story usa CSF3 padrão com export default meta e StoryObj.
Os três comandos foram repetidos: E2E falhou nos dois projetos por Chromium
ausente; Storybook test retornou código 1 pelo mesmo motivo; Storybook build
retornou código 1 com Acesso negado no manager. TypeScript e ESLint dos arquivos
técnicos desta tarefa passaram, código 0. Vite ainda emite aviso sobre ESM numa
configuração .ts em pacote sem type: module; o loader atual a carregou.
Tema Quintal, jornadas reais e reaproveitamento dos handlers TS continuam
adiados conforme o escopo autorizado. Os testes de navegador e o build devem
ser repetidos num ambiente com Chromium e acesso às pastas de resolução dos
bundlers. O catálogo e a documentação de pastas no vault permanecem pendentes.
