---
spec: 005-ui-conformance
status: in-progress
updated: 2026-10-15
---

# 005 · Design técnico

## Fundamentos (shared)

| Recurso                                                                                                | Onde                                                             | Faz                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quintalRadii` ampliado (`control` 12, `media` 16, `field` 18, `card` 24, `pill` 999) e `radius(name)` | `shared/theme/tokens/radii.ts`                                   | único jeito de pôr raio; no tema, também em `theme.quintal.radius` para `sx` (`(t) => t.quintal.radius.card`)                                      |
| Regra de lint `pethost/no-numeric-radius` (ou `no-restricted-syntax`)                                  | `eslint.config`                                                  | barra `borderRadius: <número>` em objetos de estilo, exceto 0 e `"50%"`                                                                            |
| `Surface`                                                                                              | `shared/ui/layout/Surface`                                       | superfície padrão (borda, raio, sombra `sm`/`md`/`lg`, `interactive`, `component`)                                                                 |
| `PageContainer`                                                                                        | `shared/ui/layout/PageContainer`                                 | `width: "page" \| "reading"`, gutter 16/32, `py` padrão                                                                                            |
| `PageHeader`                                                                                           | `shared/ui/layout/PageHeader`                                    | h1, subtítulo, ações                                                                                                                               |
| `FlowLayout`                                                                                           | `shared/ui/layout/FlowLayout`                                    | três faixas no computador (trilha, passo, prévia opcional); uma coluna no celular com `FlowProgress` compacto no topo e `FlowActions` fixa embaixo |
| `FlowProgress`                                                                                         | `shared/ui/navigation/FlowProgress` (substitui `WizardProgress`) | trilha vertical (computador) e anel "n/N" + nome + "Próximo" (celular); `steps: { id, label, description? }[]`, `current`, `completed`             |
| `FlowActions`                                                                                          | `shared/ui/layout/FlowActions` (evolui `FormActions`)            | Voltar (texto) + Continuar (coral); fixa embaixo no celular com área segura                                                                        |
| Cabeçalho                                                                                              | `widgets/app-shell`                                              | altura fixa 64/56, logo único, atalho ativo por prefixo, "Painel" do anfitrião                                                                     |

## T2/T3 implementados nesta worktree

- `quintalRadii` mantém os raios numéricos de configuração; `quintalRadiusCss` e `radius(name)` fornecem valores CSS com unidade, para que o MUI não multiplique tokens de `borderRadius` pelo `shape.borderRadius`. O tema expõe essas strings em `theme.quintal.radius`; `pethost/no-numeric-radius` barra os números literais em código de produto.
- `Surface` aceita `elevation: sm | md | lg`, `interactive` e `component`, e permite `sx` para geometria e composição. É usado em `HostOnboardingStages`, `PetIdCard`, `NewPetTile`, `StayList` e `HostBookingList`.
- `PageContainer` aceita `page | reading`, com máximos de 1200/720 px, gutter 16/32 px e espaçamento vertical padrão. `PageHeader` apresenta h1, subtítulo e ações responsivas. `/host` usa os dois recursos.
- `FlowProgress` recebe os passos, id atual e ids concluídos; `FlowActions` recebe callbacks de voltar/continuar; `FlowLayout` compõe trilha, passo, prévia opcional e ações. Nesta entrega são biblioteca com stories e testes: cadastros existentes permanecem em `WizardProgress`/layout próprio até T4.
- `AppShell` usa 64/56 px; `HeaderNav` escolhe o atalho correspondente de prefixo mais longo. `Painel` é o primeiro atalho do anfitrião; uma subrota de verificação seleciona “Minha verificação” e subrotas sem atalho específico selecionam “Painel”.

## Aplicação nas telas

| Grupo             | Telas                                                                                                                                            | Aplica                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Cadastros         | `/register/*` (011, 012), `/pets/new` (021), `/host/application/*` (030), `/host/listings/new` (044), `/listings/[id]/request` (050)             | `FlowLayout` + `FlowProgress`; a prévia ao vivo onde existir (carteirinha do pet, cartão do cantinho, resumo do pedido)   |
| Painéis e listas  | `/host` (044), `/pets` (020), `/owner/bookings` (052), `/host/bookings` (053), `/admin/*` (031 a 033), `/search` (041)                           | `PageContainer page` + `PageHeader` + grade; cartões com `Surface`                                                        |
| Fichas e detalhes | `/pets/[id]` e edição (022), detalhe de estadia (052/053), `/listings/[id]` (042), `/host/payments` (043), conta (`/users/*`, 015)               | `PageContainer page` com duas colunas no computador quando houver conteúdo lateral; `reading` só para texto e confirmação |
| Peças             | `HostOnboardingStages`, `PetIdCard`, `NewPetTile`, `PhotoSlots`, `DocumentSlot`, listas de estadia, `StatusPill`, `Notice`, `Hint`, `ErrorState` | tokens de raio e `Surface`                                                                                                |

## Galeria (REQ-UIC-010)

`e2e/gallery/gallery.spec.ts`, projeto Playwright `gallery` fora do CI (`npm run gallery`): sobe com o mock, entra com tutor, anfitrião (com e sem verificação) e admin, visita cada rota com estado semeado e salva `test-results/gallery/{conta}/{rota}-{desktop|mobile}.png`. Serve para a revisão humana, não é teste de snapshot.

## Matriz de testes

| REQ     | Nível                    | Onde                                                                                               |
| ------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| 001     | Lint + unitário          | regra de lint testada com casos válidos e inválidos; `radii.test.ts`                               |
| 002     | Componente + story       | `Surface.test.tsx`, stories com a11y                                                               |
| 003     | Componente + E2E         | `AppShell.test.tsx` (altura, ativo por prefixo, Painel); `shell.spec.ts`                           |
| 004/007 | Componente + story       | `PageContainer`, `PageHeader`                                                                      |
| 005/006 | Componente + story + E2E | `FlowLayout`, `FlowProgress` (computador e celular), jornadas de cadastro existentes seguem verdes |
| 009/010 | Galeria                  | revisão visual em 1440 e 390                                                                       |
