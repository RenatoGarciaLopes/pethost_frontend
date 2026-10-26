---
spec: 002-design-system
status: in-progress
updated: 2026-10-11
---

# 002 · Tarefas

- [x] (2026-10-11) **T1 · Tokens e contraste** (REQ-DS-001, 002): `colors.test.ts`, `contrast.test.ts` → `tokens/*`, `shared/lib/color/contrastRatio.ts` (movido para `src/test/a11y/` em 2026-10-12: só teste usa)
- [x] (2026-10-11) **T2 · Fontes locais** (REQ-DS-003): baixar os arquivos com licença OFL para `public/fonts`, `app/layout.tsx`, `tokens/typography.ts`; E2E de fontes
- [x] (2026-10-11) **T3 · Tema + providers** (REQ-DS-004 a 007): `overrides/Button.test.tsx` → `createQuintalTheme.ts`, `overrides/*`, `variants/*`, `types/mui.d.ts`, `bootstrap/providers/ThemeProviders.tsx`; trocar a home do scaffold por uma página de verificação do tema (temporária; removida em 2026-10-12, os E2E do tema usam `/login`)
- [x] (2026-10-11) **T4 · Movimento** (REQ-DS-008): `usePrefersReducedMotion`, `tokens/springs.ts`
- [x] (2026-10-11) **T5 · Máscaras** (base para a 011): `masks.test.ts` → `shared/lib/masks`
- [x] (2026-10-11) **T6 · Formulário I** (REQ-DS-010, 011): `SegmentedControl`, `PasswordField`, `PasswordStrengthChecklist`
- [x] (2026-10-11) **T7 · Formulário II** (REQ-DS-009, 014): `ChoiceCardGroup`, `ToggleRow`, `ChipPicker`, `Counter`, `FormActions`, `LockedField`, `MaskedTextField`
- [x] **T8 · Navegação** (2026-10-11) (REQ-DS-012): `WizardProgress`
- [x] **T9 · Feedback** (2026-10-11) (REQ-DS-013, 014): `Notice`, `Hint`, `StatusPill`, `Sticker`, `EmptyState`, `ErrorState`
- [x] **T10 · Marca** (2026-10-11) (REQ-DS-015, 016): `DoorMark`, `DoorScene`, `Daisy`, `GroundLine`, `TurmaWalker`, `SniffLoader`, `Celebration`; WebPs da turma em `public/brand/turma/` (copiados de `assets/personagens` do vault)
- [ ] **T11 · Stripe Appearance** (REQ-DS-017)
- [ ] **T12 · Stories e a11y** (REQ-DS-018): cada primitivo com stories ligadas ao board; `storybook:test` verde
- [ ] **T13 · Documentação:** TSDoc em todos; catálogo no vault (uma linha por primitivo); nota `development/resources/quintal-theme.md`; `design/09-componentes-mui.md` aponta para os arquivos reais

## Entrega T1 a T7 (2026-10-11)

Implementação autorizada nesta rodada; T8 a T13 permanecem para a próxima.
Não foram alterados docs/, vault, scripts, configurações protegidas ou recursos
HTTP/auth da spec 003. As fontes e suas licenças existentes foram reutilizadas.

### Inventário e interfaces

Todos os recursos abaixo estão implementados. Cada primitivo em
`src/shared/ui/forms/<Nome>/` contém `<Nome>.tsx`, teste, stories e `index.ts`;
props e exemplos estão no TSDoc. Estado de formulário pertence ao consumidor;
nenhum primitivo chama API ou conhece entidades de produto.

| Tarefa | Arquivos/recursos reais                                                                                                    | Uso e limites                                                                                                                                                                                        |
| ------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1     | `src/shared/theme/tokens/{colors,shadows,radii}.ts`; `src/shared/lib/color/contrastRatio.ts`                               | `quintalColors`, `hardShadow(0/3/5/8)`, raios e contraste WCAG para hex RGB opaco. Não calcula contraste de transparência.                                                                           |
| T2     | `tokens/typography.ts`; `src/app/layout.tsx`; `.storybook/fonts.css`                                                       | Next usa `next/font/local` e as variáveis `--font-display`/`--font-body`. Storybook carrega os mesmos arquivos por CSS/Vite. Base 17px; h1–h4 Caprasimo.                                             |
| T3     | `createQuintalTheme.ts`, `overrides/*.ts`, `variants/quintalVariants.ts`, `types/mui.d.ts`, `public/brand/paper-grain.png` | Tema claro CSS variables; cada override MUI em seu módulo. Primário coral/tinta, foco de teclado em tinta 3px e sombras sem blur. Grão PNG determinístico, local e sutil.                            |
| T3     | `src/bootstrap/providers/ThemeProviders.tsx` e pasta `ThemeProviders/`                                                     | Entrada estável reexporta a implementação com anatomia de componente. `ThemeProviders({children})` aplica cache App Router, tema e baseline. Não gerencia queries/sessão.                            |
| T3     | `src/app/page.tsx`, `src/app/globals.css`, `.storybook/preview.ts`                                                         | Home temporária sem lógica de domínio; baseline substitui cores/fontes do scaffold. Stories recebem o mesmo tema.                                                                                    |
| T4     | `tokens/springs.ts`; `src/shared/lib/motion/usePrefersReducedMotion.ts`                                                    | Curvas exatas da marca, assentar 340ms e acolher 660ms. Hook assina matchMedia via useSyncExternalStore; SSR/ambiente sem matchMedia prefere redução. CSS desliga transições e animações.            |
| T5     | `src/shared/lib/masks/{masks,index}.ts`                                                                                    | mask/unmask CPF, CNPJ numérico, CEP e telefone nacional. Aceitam entrada parcial e removem caracteres/excedentes. Não validam dígitos verificadores nem acrescentam DDI.                             |
| T6     | `SegmentedControl`                                                                                                         | `label, options, value, onChange, fullWidth?, disabled?`; escolha curta exclusiva, setas/Home/End e roving focus.                                                                                    |
| T6     | `PasswordField`                                                                                                            | Props de TextField, label obrigatório, rótulos opcionais Mostrar/Esconder; foco permanece no campo. Não valida nem armazena a senha.                                                                 |
| T6     | `PasswordStrengthChecklist`                                                                                                | `password, labels, label?`; cinco regras conferidas em Auth.Domain.Users.Password: 8–128 caracteres, maiúscula, minúscula, número e símbolo não branco. Não mostra a senha; API continua autoridade. |
| T7     | `ChoiceCardGroup`, `ChoiceCard`                                                                                            | Grupo controlado com label/options/value/onChange; card visual baseado em label + Radio nativo, check além da cor e avisos no nome acessível. Não é link/botão de navegação.                         |
| T7     | `ToggleRow`                                                                                                                | `label, checked, onChange, children?, disabled?`; revela conteúdo com assentar sem bloquear tarefa; respeita preferência reduzida.                                                                   |
| T7     | `ChipPicker`                                                                                                               | `label, options, selected?, onPick, disabled?`; sugere texto. Inserção, remoção e duplicação ficam no consumidor.                                                                                    |
| T7     | `Counter`                                                                                                                  | `label, value, min, max, onChange, disabled?`; inteiro entre limites inclusivos. Consumidor fornece limites e valor válido.                                                                          |
| T7     | `FormActions`                                                                                                              | `backLabel, nextLabel, onBack, onNext, disabledReason?, nextType?`; rodapé fixo no celular, área segura e espaço reservado; motivo de bloqueio associado à ação.                                     |
| T7     | `LockedField`                                                                                                              | Props TextField com `label, value, reason`; read-only, cadeado e motivo visível. Read-only não é autorização; nunca usar para segredos.                                                              |
| T7     | `MaskedTextField`                                                                                                          | Props TextField com `label, mask, value, onValueChange`; valor controlado sem máscara, apresentação formatada, cursor e exclusão junto à pontuação.                                                  |
| T6/T7  | `src/shared/ui/forms/formCopy.ts`                                                                                          | Rótulos genéricos de interação/estado; microcopy de domínio vem por props.                                                                                                                           |

### Decisões e diferenças do design

- Generator usado nos onze primitivos (inclui ChoiceCard). O gerador rejeita
  bootstrap/providers; ThemeProviders foi criado diretamente com pasta própria
  e uma entrada no caminho explicitamente solicitado, sem alterar o gerador.
- Override de TextField se divide também em OutlinedInput, seguindo a composição
  real do MUI 9. Estilos comuns ficam em surfaces; variants compartilham um módulo
  pequeno com exports independentes. createQuintalTheme apenas compõe os módulos.
- Movimento usa CSS linear() e React; não exige uma biblioteca adicional.
- SegmentedControl mantém ToggleButtonGroup exclusivo e fornece semântica radio
  e seleção por setas. ChoiceCardGroup usa RadioGroup nativo com labels visuais.
- As cinco regras de senha vêm do value object da API; não são inventadas pela UI.
  Checklist é apresentação auxiliar, não substitui validação do backend.
- `parameters.design.board` identifica Fluxo-Conta, Fluxo-Pet ou
  Fluxo-Verificacao por nome. Não foram inventadas URLs/IDs do canvas.
- Documentação em docs/vault e catálogo continuam adiados para T13 por proibição
  explícita desta rodada. Este inventário é provisório, não uma atualização do vault.

### Cobertura por nível e evidência TDD

Unitários: tokens/contraste/máscaras e curvas. Componentes: todos os primitivos,
provider e hook, usando renderWithProviders. Cobrem valor controlado, cliques,
teclado, avisos acessíveis, disabled/read-only, slots do MUI, foco, máscara parcial,
paste, cursor e limites. Overrides triviais são cobertos pela composição do tema,
stories e testes de estilos. Stories: estados padrão, vazio, erro, disabled,
seleção, limites e celular; addon a11y em modo error.
E2E: `e2e/mocked/design-system.spec.ts` verifica fontes locais, CSS computado,
contraste visual do primário, foco pelo teclado, hover/pressão e redução de
movimento, desktop/celular. O smoke existente foi preservado.

N/A: testes HTTP/integracão com API real, pois T1–T7 não fazem E/S de domínio.
Integração visual/SSR é exercitada pelo Next real no E2E simulado; unitários de
regras não precisam de jornada própria. Não foram criadas jornadas artificiais
para os stubs/ilustrações das tarefas futuras.

Vermelho observado antes do código: módulos de T1/T2/T3/T4/T5 ausentes;
19 testes de formulário falhando contra os stubs do gerador. Regressões de
label interativo e Backspace na pontuação falharam antes das correções.

### Validação final desta rodada

- `npm.cmd run storybook:test`: 13 arquivos, 41 stories/testes passaram;
  Chromium headless, a11y em modo error. O teste REQ-DS-006 mostrou primeiro
  foco invisível no Switch; o override do elemento visível tornou o teste verde.
- `npm.cmd run test:e2e:mocked`: 18 testes passaram (1,4 min), incluindo
  fontes, tema, movimento e smoke nos dois projetos, além da suíte de sessão
  existente. O smoke não precisou mudar.
- Lint dos arquivos desta rodada e `npx.cmd tsc --noEmit --incremental false`:
  passaram. `npm.cmd run lint` global: zero erros, um aviso preexistente em
  shared/lib/url/toSafeInternalPath.ts (diretiva eslint-disable não utilizada).
- `npm.cmd run verify`: exit 1 na etapa format:check, antes das demais etapas.
  Saída: `Code style issues found in 6 files`: README.md,
  specs/003-http-and-session/requirements.md, specs/010-login/design.md,
  specs/020-my-pets/design.md, specs/020-my-pets/requirements.md e
  specs/030-host-verification/requirements.md. Todos fora do escopo autorizado;
  foram preservados.
- A configuração Storybook serve `../public` para o grão local. Não utiliza
  os personagens da T10. O raio do ChoiceCard foi validado em 24px por teste
  vermelho/verde, evitando a multiplicação do número por shape.borderRadius
  realizada pelo sx do MUI.
- `npm.cmd run test:coverage` foi executado; houve timeouts de 5s sob a
  concorrência do workspace. Sem mudar testes, timeout, configuração ou limiar,
  a execução final `npm.cmd run test:coverage -- --maxWorkers=2` passou:
  `Test Files 56 passed (56)`, `Tests 328 passed (328)` (96,31s).
  Statements 96,30%, Branches 94,29%, Functions 96,44%, Lines 97,35%;
  limiar 80% atendido. Falhas intermediárias nos testes de rotas da implementação
  paralela desapareceram depois que suas funções ficaram disponíveis.
- Storybook emite aviso sobre configuração TS/ESM carregada como CommonJS em
  uma futura mudança do Vite; não impediu a execução. Configuração Vitest
  Storybook existente foi preservada.

## Entrega T8 a T10 (2026-10-11)

Componentes (anatomia `Nome.tsx` + `Nome.stories.tsx` + `index.ts`, TSDoc em pt-BR com `@example`):

- Navegação: `src/shared/ui/navigation/WizardProgress/` (trilha no computador, anel "n/total" + "Próximo: …" no celular; `variant="auto"` troca abaixo do breakpoint `md`).
- Feedback: `src/shared/ui/feedback/{Notice,Hint,StatusPill,Sticker,EmptyState,ErrorState}/`, com ícones desenhados em `feedbackIcons.tsx` (sem emoji) e superfícies por tom em `toneStyles.ts`.
- Marca: `src/shared/ui/brand/{DoorMark,DoorScene,Daisy,GroundLine,SniffLoader,Celebration,TurmaWalker}/` e `turma.ts` (caminhos e proporção dos WebP). `TurmaWalker/TurmaDog.tsx` mostra o primeiro quadro num canvas com movimento reduzido.

Decisões:

- `DoorMark` segue `marca/04-logo.md` à risca (viewBox 100 × 110, traço igual na folha e no batente, folha coral fixa via `palette.quintal.coral`, luz `palette.scene.doorLight`); hover/foco do próprio símbolo ou do link pai abre a folha (`scaleX(.55)`, mola "acolher") e esquenta a luz. Prop `withWordmark` dá a assinatura com "pethost" em Caprasimo para o cabeçalho (004).
- (Substituído em 2026-10-12, ver o registro abaixo.) `DoorScene` reagia ao formulário por `:has()` com os atributos exportados `DOOR_TARGET_ATTR` (form) e `DOOR_WARM_ATTR` (botão "Entrar"); prop `state` fixa o estado para stories. Luz respira 3,6 s; cachorro passa a cada 16 s (`TurmaWalker crossingMs=7000 intervalMs=16000`).
- `SniffLoader`: dois cachorros por vez (2 s por travessia, um a cada 0,667 s) e o empurrãozinho da folha. A interação de plantar flores (design/14-loading) ficou fora desta entrega.
- `Notice`: `erro` com `role="alert"`, demais `role="status"`; aceita `ref` e `tabIndex={-1}` para o login levar o foco ao erro.
- Movimento reduzido: o `CssBaseline` já desliga animações e transições; os WebP animados viram quadro parado.

Limpeza: BOM removido de 51 arquivos (`src`, `e2e`, `.storybook`); `bootstrap/providers/ThemeProviders.tsx` duplicado removido (fica só a pasta com anatomia; `AppProviders` importa `./ThemeProviders`).

Resultados reais (2026-10-11): `npx tsc --noEmit` sem erros; `npm run lint` 0 erros (1 aviso em `shared/lib/url/toSafeInternalPath.ts`, fora desta entrega); `npx vitest run --maxWorkers=2` 58 arquivos, 342 testes verdes; `npm run storybook:test` 28 arquivos, 86 testes verdes com a11y em modo `error`.

## Dívida de testes

O Renato pediu para deixar os testes novos para depois. Sem teste de componente ainda (só stories, que rodam no `storybook:test` com a11y): `WizardProgress`, `Notice`, `Hint`, `StatusPill`, `Sticker`, `EmptyState`, `ErrorState`, `DoorMark`, `DoorScene`, `Daisy`, `GroundLine`, `SniffLoader`, `Celebration`, `TurmaWalker`, `TurmaDog`. Casos a cobrir estão na matriz do `design.md` (REQ-DS-012 a 016).

## Registro (2026-10-11, Claude Code)

- **Camada semântica de cores:** `tokens/semantic.ts`, com `accountTones`, `surfaceColors`, `sceneColors` e `feedbackColors`. No tema:
  - `palette.account` e `palette.scene` (tipados em `types/mui.d.ts`);
  - mapeamento conforme `design/09-componentes-mui.md`: `secondary` e `info` céu, `success` grama, `warning` gema, `background.paper` branco.
- **`overrides/Link.ts`:** links em tinta com sublinhado coral (contraste AA) e foco de teclado em tinta.
- **Dívida de testes:** `semantic.ts` sem teste de contraste para os tons de conta; sem teste do override de Link.

## Registro (2026-10-12, Claude Code)

- **Motion** (`motion` 14, instalado com `--ignore-scripts`): molas `MOTION_ASSENTAR` (`bounce 0`) e `MOTION_ACOLHER` (`bounce 0.39`, cerca de 9% de quique) em `tokens/springs.ts`, com teste que confere duração e quique contra as curvas CSS; `EASE_AMBIENTE` para fundo. `bootstrap/providers/MotionProvider.tsx` (`reducedMotion="user"`) entra no `AppProviders`.
- **`Reveal`** (`shared/ui/motion/Reveal`): monta a tela em ordem (`order` × 60 ms, mola "assentar"); story `Quintal/Motion/Reveal`.
- **`DoorScene` reescrita em Motion**, sem o cachorro e sem a prop `size` (ocupa a largura do contêiner; quem usa limita):
  - tudo num SVG só (`viewBox` 360 × 300): céu em arco com degradê (`sceneColors.sky*`, antes sem uso) e duas nuvens, gramado, horizonte traçado, facho, porta, capacho, margaridas e pólen;
  - monta-se sozinha; depois liga o ambiente (luz respirando, pólen, nuvens, flores balançando);
  - de brincar: mouse na porta entreabre; clique na porta ou no capacho abre e volta; clique no gramado planta margarida (até 6); flores se sacodem; parallax com mouse fino;
  - `useDoorTarget` troca o `:has()`: escuta `pointerover`/`focusin` no documento e procura os atributos, então a cena e o formulário continuam sem importar um ao outro;
  - `onPointerDown` com `preventDefault`: brincar não tira o foco do campo.
- **`Daisy`**: o desenho virou `DaisyGlyph`, usado pela `Daisy` e dentro da cena.
- **Código morto removido:** variantes de Chip `sticker`/`attention` e de Paper `panel` (sem uso; o `Sticker` e o `StatusPill` são componentes próprios). Fica só o Chip `ok`, usado pelo `ChipPicker`. A página de teste do tema e os SVGs do modelo do Next em `public/` saíram.
- **Dívida de testes:** `Reveal`, `DoorScene` (interações), `useDoorTarget`, `usePointerParallax`, `DaisyGlyph`.
