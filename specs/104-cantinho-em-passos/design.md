# Design e recursos

## Os passos

Nove, e não os oito da nota de decisão: "Sua casa" da 044 tinha quatro perguntas de duas ideias diferentes (o jeito da
casa e como ela se apresenta). Separar "Sua casa" (tipo e quintal) de "Nome e descrição" deixa a sugestão "Casa da
{nome}" depois do tipo da casa, então ela já vem como "Apê da …" quando é apartamento. O resto segue a ordem da
proposta. Regras é opcional e passa sem resposta.

| #   | Passo (`id`)                     | Campos                          | Controle                                                                |
| --- | -------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| 1   | Sua casa (`home`)                | `homeType` (só PF), `hasYard`   | `ChoiceCardGroup` com cartões em coluna e desenho; Sim/Não largo        |
| 2   | Nome e descrição (`title`)       | `title`, `description`          | campo + sugestão em `ChipPicker`; descrição com perguntas-guia          |
| 3   | Quem mora com você (`household`) | `hasDogs`, `hasCats`, `hasKids` | três Sim/Não; atalho "Apresentar quem mora aqui"                        |
| 4   | Quem você recebe (`guests`)      | espécies, portes, `capacity`    | `CheckCardGroup` compacto (2/3 colunas), portes em 3 cartões, `Counter` |
| 5   | Endereço (`address`)             | `address.*`                     | `AddressFields` (CEP preenche)                                          |
| 6   | Regras da casa (`rules`)         | `houseRules`                    | chips de atalho + texto                                                 |
| 7   | Dias que recebe (`weekdays`)     | `availableWeekdays`             | `WeekdayPicker`                                                         |
| 8   | Diária por pet (`rate`)          | `nightlyRate`                   | número grande + simulação em `Surface` gema clara                       |
| 9   | Confere e abre (`review`)        | —                               | blocos com "Editar"                                                     |

## Recursos novos ou alterados

### StepWizard (shared/ui/navigation) — `aside`

Prop opcional `aside?: ReactNode`. Com ela, a partir de `lg` a grade vira `240px | 1fr | 288px` com gap 40 px, que cabe
na grade do cabeçalho (1136 px); a coluna fica presa ao rolar e some abaixo de `lg`. Sem `aside`, a casca é a de antes
(272 | até 720), então cadastro e verificação não mudam. Consumidor: `ListingDraft`.

### ChoiceCardGroup (shared/ui/forms) — `layout="row"` e rótulo em negrito (rodada 1)

Colunas iguais em qualquer largura para duas escolhas curtas (tipo de casa); o rótulo `body` passa a 700, como o `SegmentedControl` e os rótulos de campo.

### ChoiceCard (shared/ui/forms) — `control`, `orientation`, `density`

- `control="checkbox"` + `onCheckedChange` (para `CheckCardGroup`); padrão `radio`, como antes.
- `orientation="column"`: desenho grande em cima, centralizado, 152 px (o cartão de papel do cadastro).
- `density="compact"`: 56 px, texto em 15 px sem hifenização automática e selo ✓ pendurado na quina com aro de papel (`SelectedBadge placement="corner"`), para o texto ter a largura toda (listas longas).
- Em coluna, no celular: 112 px, desenho de 40 px, título 16 px (dois cartões lado a lado).
  Padrões preservam os consumidores (pets, verificação, checkout).

### CheckCardGroup (shared/ui/forms) — novo

Escolha múltipla em cartões: `fieldset` + `legend`, `ChoiceCard` com checkbox, devolve na ordem das opções, `error`
descreve o grupo, `ref` no `fieldset` para o foco de erro, `columns` por breakpoint e `density`. Motivo de existir: o
`ChoiceCardGroup` é de uma resposta (radio) e o `ChipPicker` insere texto num campo; nenhum servia para "marque os que
quiser". Consumidores: espécies e portes do cantinho (cadastro e edição).

### WeekdayPicker (shared/ui/forms) — visual

"Todos os dias" virou uma caixa de marcar no topo do próprio controle (marca/desmarca a semana; parcial com parte dela)
e os 7 dias viraram botões de marcar de 56 px (grama + ✓, afundam 3 px), abreviados na tela ("Seg") com o nome inteiro
para o leitor de tela. Grade de 4 colunas no celular e 7 a partir de `sm`. `ref` passa a ser do `fieldset`. Interface
igual; `formCopy.weekdaysShort` novo. Único consumidor: host-listings.

### Counter (shared/ui/forms) — visual

Botões de 48 px, número grande na fonte de título, entrando com a mola "assentar" (sem animação com movimento reduzido).
Interface igual. Único consumidor: host-listings.

### ListingCardFace (shared/ui/data-display) — novo, extraído do ListingCard

A cara do card da busca, sem link nem dados: moldura 4:3 com selo e chip do anfitrião, título (`titleComponent`,
padrão `h2`), lugar, atributos com `AttributeIcon` (movido de `features/search/.../ListingCard/`), extras e preço. A
busca (`ListingCard`) compõe dentro do link, com o mesmo visual; o cadastro monta ao vivo. Motivo: o card da busca é
uma feature e features não importam outra; a peça visual foi para `shared` em vez de copiar o card.

### host-listings

- `lib/listingSteps.ts`: `LISTING_STEP_IDS`, `LISTING_STEPS` (textos + campos), `LISTING_FIELDS`, `REVIEW_INDEX`,
  `toFormField` (campo da API → do formulário), `stepIndexOf`, `firstStepWithError`.
- `lib/listingSummary.ts`: `listingSummary` (uma linha por bloco da revisão), `acceptedSpeciesText`, `capacityText`,
  `rateTexts`.
- `schemas/listingResolver.ts`: `toFieldErrors` (movido do `ListingSectionHost`), `listingErrors` (valida seção por
  seção, então o porte é conferido mesmo com outros passos em branco) e `listingResolver` (resolver do formulário único).
- `lib/listingDraft.ts`: `{ values, step? }`; o `done` antigo é descartado na leitura.
- `components/client/fields/`: os campos compartilhados pelo assistente e pela edição (`HomeFields`, `HouseholdFields`,
  `GuestsFields`, `StayFields`, `ListingYesNo`, `HomeIllustration`).
- `ListingDraft`: o assistente (formulário RHF único, `mode: "onTouched"`, `form.subscribe` grava o rascunho com o passo
  e reconfere campo com erro).
- `ListingPreview`: o card ao vivo; `ListingReview`: os blocos com "Editar" e o erro sem campo (`root.server`).
- `ListingSections`/`ListingSectionHost`: agora só a edição; sem `mode`, `focusSection` nem `sectionAnchor` exportado.

### Removidos

`ListingSectionsPanel`, `sections/HomeSection`, `HouseholdSection`, `GuestsSection`, `SimpleSections`, e as copies
`sectionSaved`, `ready`, `pending`, `draft.missing/allReady/panelLabel/openDisabled/fixSection`; `rate.simulation`
virou `simulationLead` (com singular de pet/noite). `LISTING_SECTIONS`/`SECTION_FIELDS` deixam de ser exportados.

## Validação por nível

- Unitário: `listingSteps.test.ts`, `listingSummary.test.ts`; componentes compartilhados com teste funcional
  (`CheckCardGroup`, `ChoiceCard`, `WeekdayPicker`, `Counter`, `StepWizard`, `ListingCardFace`).
- Integração (jsdom + MSW): `ListingDraft.int.test.tsx` (16 jornadas) e `ListingEditor.int.test.tsx` (edição com os
  campos novos); `ListingCard.test.tsx` garante a busca igual.
- Stories (Chromium + axe): `ListingDraft.stories.tsx` (passo 1 com bloqueio, restaurado, diária, revisão, empresa,
  celular) e as dos compartilhados.
- E2E: `e2e/mocked/host/listing.spec.ts` reescrito para os passos; execução no CI.
