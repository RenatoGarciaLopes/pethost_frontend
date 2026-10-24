# 098 — verificação no mesmo multistep do cadastro: resultados de teste

Branch testada: `fix/098-verification-wizard` @ `a4154ff` (base `dev` @ `408578a`). Data: 2026-10-24.
Ambiente: Windows 11, worktree isolada com `node_modules` por junction ao checkout principal (sem `npm ci`, regra das worktrees).

| Check | Resultado |
| --- | --- |
| `npx tsc --noEmit` | passou (exit 0) |
| `npm run lint` | passou (exit 0, sem avisos) |
| `npx vitest run` (unit, component, integration, integration-dom) | 2177/2200 na rodada completa; os 23 que falharam (9 arquivos, nenhum tocado pela 098) eram timeouts de 5 s/15 s com a máquina carregada; rerun dos 9 arquivos com `--maxWorkers=2`: 76/76 passaram → flaky de carga |
| Stories (Vitest + Storybook + axe, `vitest.storybook.config.ts`) | branch: 406/423. 14 falhas já existem na `dev` (HomeFidelity 5, ToggleRow 1, SearchFilterBar 3, SearchSummaryBar 5). **Novas na 098**: StepWizard (2) e ApplicationWizard (4), ver abaixo |
| E2E mocked-desktop (registration + host/verification) | 10/10 passam (5 falhas da 1ª rodada eram compilação a frio e passaram no rerun) |
| E2E mocked-mobile (registration + host/verification) | 9/10: **falha real** em `e2e/mocked/host/verification.spec.ts:56` |

## Falhas reais

1. `e2e/mocked/host/verification.spec.ts:56` (só mocked-mobile, reproduz no rerun):
   `expect(page.getByText("Passo 1 de 4")).toBeVisible()` → *strict mode violation: resolved to 2 elements*:
   o `<p>` "Passo 1 de 4" do StepWizard e o texto oculto do anel `Passo 1 de 4: ` em
   `src/shared/ui/navigation/WizardProgress/WizardProgress.tsx:99-100` (só renderizado no celular). Precisa de `exact: true`
   (ou outro seletor); o layout está certo.
2. Stories novas/afetadas falham no axe e no `toBeVisible` porque medem durante a entrada animada do `StepWizard`
   (`Reveal` + `motion.div` com `opacity: 0` inicial, `StepWizard.tsx:68-92`). Na `dev` as 5 stories do ApplicationWizard passam.
   - `src/shared/ui/navigation/StepWizard/StepWizard.stories.tsx` "REQ-DS-012 Primeiro passo" e "Último passo com aviso":
     `color-contrast` 1.06 (`#f7f3ec` sobre `#fefaf3`) — cor no meio do fade.
   - `ApplicationWizard.stories.tsx:103` "REQ-HVER-003 Antes de começar": `toBeVisible()` falha no `h1` (opacidade 0).
   - "REQ-HVER-004 Seus dados", "REQ-HVER-006 Fotos", "REQ-HVER-010 Confere e envia": `color-contrast` 1.32 (`#e0dcd6` sobre `#fefbf5`).
   - `RegistrationScreen.stories.tsx` passa porque espera a entrada (`waitForEntrance`, opacidade 1) antes do axe; as stories
     do StepWizard e do ApplicationWizard não esperam.

## Flaky

- Vitest: 23 timeouts sob carga (ProfileEditor.owner*, PetWizard*, Calendar, DateRangeField, SearchBar, AuditFilters, HomeScreen); 100% verdes no rerun.
- E2E: `registration/host.spec.ts:14`, `:57`, `registration/owner.spec.ts:37`, `:54`, `:65`, `host/verification.spec.ts:41` (desktop) — compilação a frio do `next dev`; verdes no rerun serial.

## Notas de ambiente

- Turbopack recusa o `node_modules` por junction ("Could not find the Next.js package"); os servidores foram subidos à mão
  (`node e2e/support/mock-backend.mjs` e `next dev -p 3100 --webpack`) e o Playwright os reutilizou (sem `CI=1`).
- Storybook: com a junction, o Vite bloqueava o setup do addon fora da raiz; usei um config temporário (não commitado) que só
  estende `vitest.storybook.config.ts` com `server.fs.allow` do checkout principal.

## Capturas (full page; 1440×900 e 390×844)

Verificação (`/host/application/new`), branch: `branch-verificacao-1-antes-de-comecar-*`, `-2-seus-dados-*`, `-3-fotos-*`,
`-3b-fotos-preenchidas-*`, `-4-confere-*`.
Cadastro (`/register/host`), branch: `branch-register-host-1-voce-*`, `-2-endereco-*`, `-3-pronto-*`.
Cadastro na `dev`: `dev-register-host-1-voce-1440.png`, `dev-register-host-1-voce-390.png`.

No celular a barra de ações é fixa no rodapé, então na captura full page ela aparece no meio da página (igual no cadastro).
O selo "Cache disabled"/"N" é o indicador do `next dev`.

### Comparação visual

- Cadastro dev × branch, passo 1: **idênticos pixel a pixel** em 1440 (1440×1101) e 390 (390×1664), 0 px diferentes.
- Verificação × cadastro: mesma casca — título "VERIFICAÇÃO" + trilha de cartões à esquerda (anel "n/4" + "Próximo: …" no
  celular), "PASSO n DE 4", `h1` grande, linha tracejada e Voltar/Continuar com o botão coral à direita.
- Diferenças que sobram: a verificação fica dentro do app shell (cabeçalho do anfitrião e gramado no rodapé), o cadastro não;
  "Antes de começar" e "Seus dados" não têm frase de apoio, então o `h1` encosta no primeiro cartão (~8 px); em Fotos, o aviso
  "Falta a frente, o verso e a selfie." fica entre a linha tracejada e os botões; em Confere o voltar é "Voltar: fotos" (nos
  outros passos, "Voltar"); o cartão selecionado "Pessoa física" usa ✓ simples à direita, e os cartões de papel do cadastro usam
  o selo preto no canto.
