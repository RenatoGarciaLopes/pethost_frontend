# Validação 104 — 25/10/2026

## Checks executados

- `npx vitest run src/features/host-listings src/shared/ui/forms src/shared/ui/navigation src/shared/ui/data-display src/features/search src/features/registration src/features/host-applications src/features/pets "src/app/(host)" --maxWorkers 2`: **132 arquivos, 690 testes aprovados** (604,75 s). Inclui os consumidores de `ChoiceCard`/`ChoiceCardGroup`/`SegmentedControl` (pets, cadastro, verificação) e a busca (`ListingCard` sobre `ListingCardFace`).
  - `ListingDraft.int.test.tsx`: 16 jornadas (passo 1 de 9 e "Continuar: nome"; bloqueio do "Continuar" com foco no campo e erro que some ao escolher; avançar e voltar sem perder valor, foco no título e card ao vivo sem a rua; rascunho reabre no passo salvo e guarda o passo novo; "Começar de novo"; formato antigo `done` abre no primeiro passo que falta; portes só com cachorro e obrigatórios, com foco no grupo; simulação líquida; "Editar" leva ao passo e "Voltar pra revisão"; um `POST` só com duplo clique; erro de campo da API volta ao endereço com foco no CEP; endereço não localizado; mapa fora do ar com aviso focado e rascunho mantido; endereço da conta sugerido; atalho dos pets da casa; "Voltar" no passo 1 vai ao painel sem apagar).
  - Unitários novos: `listingSteps.test.ts` (4) e `listingSummary.test.ts` (3); funcionais novos/alterados: `CheckCardGroup` (3), `ChoiceCard` (checkbox), `WeekdayPicker` ("Todos os dias" parcial/marca/desmarca), `StepWizard` (`aside`), `ListingCardFace` (2).
  - Rodada intermediária com todos os workers: 3 testes do calendário (`Calendar`, `DateField`, `DateRangeField`) estouraram 5 s; isolados, 43/43 passaram. Sem relação com esta mudança (máquina compartilhada sob carga); a rodada final com `--maxWorkers 2` passou inteira.
- Stories (Chromium + axe), config temporária copiada da `vitest.storybook.config.ts` com `server.fs.allow` para `C:/Users/Renato Lopes/Desktop/PetHost`, **removida depois**: host-listings, `shared/ui/forms`, `shared/ui/navigation`, `shared/ui/data-display`, `ListingCard`, registration, `ApplicationWizard` e `PetWizard`: **34 arquivos, 142 stories aprovadas**. Primeira rodada: 4 stories do `ListingDraft` reprovaram em contraste porque o axe media o texto ainda no fade de entrada; corrigido com `play: waitForEntrance`, como nas stories do cadastro.
- `npx tsc --noEmit`: aprovado. `npx eslint` em host-listings, `shared/ui`, search e `e2e/mocked/host`: aprovado (o `form.watch` foi trocado por `form.subscribe` para o React Compiler memoizar; o passo atual do rascunho é lido de um ref atualizado em efeito). `npx prettier --check src e2e specs/104-cantinho-em-passos`: aprovado. `git diff --check`: aprovado.
- E2E: **não executado**, por instrução do brief (vai para o CI). `e2e/mocked/host/listing.spec.ts` reescrito para os passos (helper `continueTo`, títulos dos passos, "Todos os dias" como caixa de marcar, bloco da revisão). Nenhum outro spec dependia dos botões "Salvar X" do cadastro.

## Prints (1440 e 390)

`next dev --webpack -p 3104` nesta worktree com o backend simulado (`e2e/support/mock-backend.mjs`), conta anfitriã sintética com recebimento ligado e ViaCEP interceptado. Scripts de captura em `test-results/104/` (pasta ignorada pelo git).

- `test-results/104/passos/`: cada passo e a revisão em 1440 (página inteira) e 390 (tela visível; `-fim` quando o passo rola): `01-sua-casa`, `01b-sua-casa-erro`, `01c-sua-casa-respondida`, `02-nome-e-descricao`, `03-quem-mora`, `04-quem-recebe`, `04b-quem-recebe-erro-porte`, `05-endereco`, `06-regras`, `07-dias`, `08-diaria`, `09-confere-e-abre`.
- `test-results/104/refs/`: cadastro de conta (anfitrião, passo 1), verificação (passo 1) e o cadastro antigo, em 1440 e 390.
- Lado a lado: `comparar-01-cadastro-1440`, `comparar-01-cadastro-390`, `comparar-prancha-conta` (com `telas-conta.png`), `comparar-prancha-cantinho` (com `telas-cantinho.png`), `comparar-verificacao-1440`.
- Foco registrado em cada captura: título do passo ao trocar; primeiro campo com erro no bloqueio (cartão "Casa", grupo dos portes).
- Rolagem horizontal em 390: `document.documentElement.scrollWidth` medido nas 12 capturas, todas com 390 (sem rolagem).

## O que ainda difere

- **Largura do passo** no computador é ~528 px (com a coluna ao vivo, para caber na grade de 1136 px do cabeçalho); no cadastro de conta o passo vai até 720 px. Entre 900 e 1199 px a coluna ao vivo some e o passo volta à largura do cadastro.
- **Prancha `telas-cantinho.png`** mostra o painel de seções (superado pela decisão); a revisão reaproveita o resumo por bloco e o check, mas em lista de uma coluna.
- **Referência de preço da cidade** (nota 19) continua fora: a API não tem esse dado.
- O cadastro de conta tem rodapé "Já tem conta? Entrar"; o do cantinho não tem rodapé.
- Celular: nas capturas de página inteira a barra fixa e o cabeçalho aparecem no meio (efeito da captura); por isso os prints de 390 são da tela visível.

## Revisão, rodada 1 (25/10/2026)

- **Rótulos de grupo em negrito.** `SegmentedControl` e `ChoiceCardGroup` (variante `body`) passam a dar o rótulo em 700, o peso dos rótulos de campo do tema (`TextField`) e do "Você entra como" da prancha `telas-conta`. Vale para todos os consumidores (cadastro do pet, verificação, decisões de reserva, checkout); o cadastro de conta não usa esses dois componentes e não muda. Passos 1, 3, 4 e 7 conferidos nos prints.
- **Passo 1 no 390.** `ChoiceCardGroup` ganhou `layout="row"` (colunas iguais em qualquer largura) e o `ChoiceCard` em coluna fica mais baixo no celular (112 px, desenho de 40 px, título 16 px). Casa e Apartamento lado a lado; "Tem quintal?" e o Sim/Não aparecem sem rolar em 390x844 (`passos/01c-sua-casa-respondida-390.png`). Legenda do apartamento encurtada para "Prédio ou condomínio".
- **Grade de espécies.** `CheckCardGroup` com `grid-auto-rows: 1fr` (linhas iguais). "Outro bicho" com "aceito conversar" como descrição, no padrão dos portes. Cartão compacto em 15 px com `hyphens: manual`: medido na fonte do site, "Porquinho-da-índia" tem 135 px e o cartão do celular deixa 145 px, então fica numa linha. Para liberar a largura, o selo ✓ do cartão compacto fica pendurado na quina, com aro de papel (`SelectedBadge placement="corner"`).
- **Local no card.** "Centro · São Paulo" não é fallback: é o endereço da conta no backend simulado (CEP 01001000, `e2e/support/handlers/accountProfile.mjs`), que é o começo do rascunho. O "Zona 01 · Maringá" do passo 8 vinha do meu script de captura, que respondia Maringá para qualquer CEP, e o `AddressFields` reescrevia os campos. O script agora responde o endereço do próprio CEP da conta e o card mostra o mesmo local do passo 1 ao 9. Sem bairro, o card já mostrava "Seu bairro · sua cidade" (nunca cidade inventada).
- **Testes.** `npx vitest run src/shared/ui/forms src/features/host-listings src/features/pets src/features/host-applications --maxWorkers 2`: 89 arquivos, 500 testes aprovados (novos: peso do rótulo no `SegmentedControl`, `layout="row"` no `ChoiceCardGroup`, nome do cartão "Outro bicho. aceito conversar"). Stories (config temporária com `server.fs.allow`, removida): host-listings, `shared/ui/forms`, registration, `ApplicationWizard` e `PetWizard`, 110 stories em 26 arquivos; 109 passaram e "REQ-HVER-004 Seus dados" falhou uma vez (`h1` ainda vazio no `toBeVisible`, sob carga paralela). Isolada, a story da verificação passou 5/5 duas vezes seguidas. `tsc`, `eslint`, `prettier --check` e `git diff --check` aprovados.
- **Prints.** Todos os passos refeitos em 1440 e 390 em `test-results/104/passos/` (cópia em `r1/`), incluindo 1, 4 e 9; comparações `comparar-*.png` regeneradas. Rolagem horizontal em 390: `scrollWidth` 390 nas 12 capturas.

## Documentação

Spec em `specs/104-cantinho-em-passos/`; árvore em `docs/folder-structure.md`. Vault: regra 12 de `design/17-cadastros-e-formularios.md` (e duas linhas na tabela visual), "Etapa 3" de `design/19-abrir-meu-cantinho.md`, nota da decisão (9 passos), `development/resources/host-listings.md` (seção da 104), `development/resources/choice-card-group.md`, `development/frontend-folder-responsibilities.md` e `development/resource-catalog.md`. O vault não entra no commit da branch frontend.
