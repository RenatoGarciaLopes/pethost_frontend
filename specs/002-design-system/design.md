---
spec: 002-design-system
status: draft
updated: 2026-10-11
---

# 002 · Design técnico

## Tema

```
src/shared/theme/
  tokens/colors.ts        objeto `quintalColors` (fonte única dos hex)
  tokens/shadows.ts       `hardShadow(n)` → `${n}px ${n}px 0 tinta`
  tokens/radii.ts · tokens/typography.ts
  tokens/springs.ts       `SPRING_ASSENTAR` e `SPRING_ACOLHER` (curvas linear() de design/06-movimento)
  overrides/<Componente>.ts   styleOverrides por componente MUI (Button, TextField, Chip, Card, Paper, Switch, ToggleButton, Tooltip)
  variants/               variants novas: Button `quiet`; Chip `ok` (usado pelo `ChipPicker`)
  types/mui.d.ts          module augmentation (cores `grama`, `gema`, `ceu`; variants)
  integrations/stripe/toStripeAppearance.ts
  createQuintalTheme.ts   compõe tudo; exporta `quintalTheme`
```

- `bootstrap/providers/ThemeProviders.tsx` (client) aplica `AppRouterCacheProvider` (`@mui/material-nextjs/v16-appRouter`), `ThemeProvider` e `CssBaseline`.
- O grão de papel entra como fundo no `CssBaseline`, a partir de um PNG local.
- As fontes ficam em `src/assets/fonts`, carregadas em `app/layout.tsx` com `next/font/local`; as variáveis CSS vão para a `typography` do tema.

## Ajuste dos campos em 19/10/2026

A pedido do Renato, `shared/theme/overrides/surfaces.ts` deixa de aplicar o contorno azul externo ao `MuiOutlinedInput` focado. A mudança compartilhada alcança `TextField`, senha e demais campos outlined; mantém borda, sombra e borda de erro. Não cria componente ou recurso reutilizável novo.

Regressão de componente em `OutlinedInput.test.tsx`: foco, digitação e borda normal/de erro. Regressão Playwright em `e2e/mocked/design-system.spec.ts`: e-mail e senha com clique e teclado, nos projetos desktop e celular. Unitários e integração com API não se aplicam, pois a mudança é apenas de estilo e não altera lógica ou contratos.

As políticas e o catálogo do vault referenciados em `AGENTS.md` não foram encontrados nos caminhos indicados neste ambiente. Este registro local documenta a alteração; a atualização do Obsidian permanece pendente de acesso ao vault.

Validação: quatro testes de componente aprovados (OutlinedInput e FormLabel), lint e formatação aprovados. A regressão Playwright passou em desktop e celular usando o Chrome instalado e o servidor existente na porta 3000, com configuração temporária fora do repositório; o Chromium gerenciado pelo Playwright não está instalado.

## Primitivos (`shared/ui`)

| Componente                                                                 | Base MUI                      | Responsabilidade (uma)                                                       |
| -------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| `PasswordField`                                                            | `TextField`                   | Alternar a visibilidade da senha                                             |
| `MaskedTextField`                                                          | `TextField`                   | Aplicar uma máscara pura (`shared/lib/masks`) e devolver o valor sem máscara |
| `SegmentedControl`                                                         | `ToggleButtonGroup` exclusivo | Escolha curta entre 2 e 4 opções                                             |
| `ChoiceCardGroup` / `ChoiceCard`                                           | `ButtonBase` + `RadioGroup`   | Escolha visual com ícone                                                     |
| `ToggleRow`                                                                | `Switch` + `label`            | Liga/desliga que revela conteúdo (`children` com a mola "assentar")          |
| `ChipPicker`                                                               | `Chip`                        | Atalhos que inserem texto num campo (`onPick(text)`)                         |
| `Counter`                                                                  | `ButtonBase` × 2              | Inteiro com mínimo e máximo                                                  |
| `FormActions`                                                              | `Box`                         | Voltar e continuar; fixo no rodapé no celular                                |
| `LockedField`                                                              | `TextField` read-only         | Campo travado com cadeado e motivo                                           |
| `PasswordStrengthChecklist`                                                | lista                         | 5 regras da API, vivas (`aria-live="polite"`)                                |
| `WizardProgress`                                                           | `Stepper` customizado         | Trilha (computador) e anel (celular)                                         |
| `Notice` · `Hint` · `StatusPill` · `Sticker` · `EmptyState` · `ErrorState` | `Alert` / `Paper` / `Chip`    | Feedback e rótulos                                                           |
| `SniffLoader` · `Celebration` · `TurmaWalker`                              | N/A                           | Movimento da turma (WebP da marca em `public/brand/turma/`)                  |
| `DoorMark` · `DoorScene` · `Daisy` · `GroundLine`                          | SVG                           | Marca e ilustração                                                           |

**Regra:** primitivo não conhece domínio. Textos chegam por props, o que não é texto chega por `children`, e o primitivo nunca chama a API.

## Funções puras

- `shared/lib/masks`: `maskCpf`, `maskCnpj`, `maskCep` e `maskPhone`, mais as versões `unmask*`.
- `shared/lib/motion`: `usePrefersReducedMotion`.
- `shared/theme/integrations/stripe`: `toStripeAppearance`.

## Matriz de testes

| REQ             | Nível                  | Arquivo                                                                                                     | Caso                                                                                   |
| --------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 001             | Unitário               | `tokens/colors.test.ts`                                                                                     | Os tokens batem com a tabela do REQ (protege contra mudança acidental)                 |
| 002             | Unitário               | `tokens/contrast.test.ts`                                                                                   | O contraste tinta/coral é ≥ 4,5 e branco/coral < 4,5 (função `contrastRatio` pura)     |
| 003             | E2E simulado           | `e2e/mocked/design-system.spec.ts`                                                                          | Nenhuma requisição a `fonts.googleapis.com`; o `h1` computa Caprasimo                  |
| 004/005/006/007 | Componente             | `overrides/Button.test.tsx`                                                                                 | Estilos computados por estado (borda, sombra, `min-height`); foco visível pelo teclado |
| 008             | Unitário + componente  | `usePrefersReducedMotion.test.ts`, `TurmaWalker.test.tsx`                                                   | Com reduced motion, a animação não é aplicada                                          |
| 009             | Componente             | `ChoiceCardGroup.test.tsx`                                                                                  | Setas mudam a seleção; o `aria-checked` acompanha; o clique chama `onChange`           |
| 010             | Componente             | `SegmentedControl.test.tsx`                                                                                 | Idem, com valor controlado                                                             |
| 011             | Componente             | `PasswordField.test.tsx`                                                                                    | O toggle muda o `type` e o `aria-pressed`; o foco permanece                            |
| 012             | Componente             | `WizardProgress.test.tsx`                                                                                   | Estados feito, atual e falta; `aria-current`; a variante de celular por prop `variant` |
| 013             | Componente             | `Notice.test.tsx`                                                                                           | O papel ARIA por tom; o ícone presente                                                 |
| 015             | Componente             | `DoorScene.test.tsx`                                                                                        | `aria-hidden`; a classe de estado aberta quando o alvo recebe foco                     |
| 017             | Unitário               | `toStripeAppearance.test.ts`                                                                                | Mapeia cor principal, fonte e raio                                                     |
| 018             | Storybook test         | `*.stories.tsx`                                                                                             | Stories rodam e o a11y não tem violação                                                |
| masks           | Unitário               | `masks.test.ts`                                                                                             | Máscara e desmáscara, entradas parciais e caracteres inválidos                         |
| 014             | Componente + Storybook | `Hint`, `StatusPill`, `Sticker`, `EmptyState`, `FormActions`, `LockedField` (`*.test.tsx`, `*.stories.tsx`) | render, papel acessível, `FormActions` fixo no celular                                 |
| 016             | Componente             | `TurmaWalker.test.tsx`, `Celebration.test.tsx`                                                              | toca uma vez, não bloqueia clique, sem animação com `prefers-reduced-motion`           |

## Foco em tinta (072, 22/10/2026)

Token `foco` removido; `focusRing` e Link usam `tinta`, DocumentSlot usa `:focus-visible` nativo. HomeScreen não desenha mais contorno em células por `:focus-within`. A extração da barra para SearchBar deve preservar esta regra. Foco do controle permanece gerenciado pelo navegador e MUI. Story `src/shared/theme/Focus.stories.tsx` cobre botão, chip, link e input. Testes e limites na nota `development/resources/frontend-focus` do vault e decisão `2026-10-22-foco-sem-azul`.

Validação final 072: E2E isolado da home com CI=1 e webpack na 3100/mock 5099, desktop+celular: 2/2 aprovados. Inclui mouse no Select, retorno pelo teclado e foco na célula da data transparente. Servidores encerrados, configs temporários removidos. Demais passes e limites: nota frontend-focus do vault. A comparação visual antes dos controles é reconstruída pela cor do CSS antigo; os prints após são do código entregue.
