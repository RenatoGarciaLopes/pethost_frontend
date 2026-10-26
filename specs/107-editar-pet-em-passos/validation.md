# Validação — 107

## Execuções da retomada

- PetEditor.int, PetWizard.test, PetWizardScreen.test e petEditSections.test: **35 testes em 4 arquivos aprovados**, antes do bloqueio adicional de navegação ocupada.
- WizardProgress e ConfirmDialog: recorte inicial aprovado, com novos testes de seleção livre, menu mobile e terceira ação. Bloqueio de gravação acrescentado depois.
- Stories de PetEditor/PetWizard: **18 aprovadas**, incluindo axe após reutilizar `waitForEntrance` para aguardar a opacidade final da StepWizard. Medir contraste durante o fade gerava falhas; não foram desativadas regras de acessibilidade.
- Rodada ampliada `node node_modules/vitest/vitest.mjs run src/features/pets src/shared/ui/navigation src/shared/ui/feedback/ConfirmDialog src/shared/ui/forms/ChoiceCardGroup --maxWorkers=1`: 255/258 aprovados. Falhas identificadas: clique de teste sobre botão disabled com pointer-events:none, assertiva de visibilidade antes do fade e seletor Saúde ambíguo entre h1 e título da carteirinha. Os três testes foram corrigidos sem aumentar timeout; repetição pertinente registrada abaixo.
- Typecheck global aprovado após corrigir fixture que atribuía undefined a boolean obrigatório. ESLint identificou setState em efeito e inferência de ref no chrome; URL passou a useSyncExternalStore e refs foram desestruturadas. Checks finais registrados após conclusão.

## Cobertura e limites

Unitários: petEditSections.test resolve seções, fallback, peso em kg/gramas, idade, fotos e resumos. Funcionais/integração: PetEditor.int cobre navegação, URL, foco, PATCH mínimo, três decisões, validação, erros de API e fotos; PetWizard e PetWizard.int cobrem avanço/revisão, campos condicionais, erros de API, criação e retries; shared mantém modo informativo e testa modo navegável. Mocks HTTP são MSW, sem equivalência à API real.

Chromium: stories dos dois fluxos e capturas em `test-results/107/`, 1440/996/390. Cadastro com trilha ao lado em 996/1440 e anel no celular; edição Saúde sem overflow nas três larguras. Capturas inspecionadas. São previews isolados, sem cabeçalho/rodapé da aplicação. E2E pertinente: pets/new-pet.spec.ts, pets/pet-profile.spec.ts e host/house-pets.spec.ts; execução coordenada separadamente. Não há helper/fixture compartilhado novo.

## Correções e repetição

Depois dos ajustes descritos, `PetWizard.int.test.tsx` + `WizardProgress.test.tsx`, maxWorkers=1: **16 testes em 2 arquivos aprovados**. A rodada ampliada anterior tinha 255 aprovados; os três casos que falharam estão incluídos nessa repetição verde. Não foi repetida artificialmente toda a suíte sem novas alterações. Capturas adicionais abrangem as sete seções da edição em 1440/390; sem overflow. O rodapé mobile mostra Salvar/Próxima, mantendo Anterior no desktop.

## Navegação e largura útil

14 stories de PetEditor/WizardProgress/StepWizard aprovadas após incluir troca com rascunho e foco no destino. As capturas das sete seções revelaram overflow só em Convivência/390 por largura mínima automática da grade; StepWizard passou a usar minmax(0, 1fr) e Reveal minWidth:0. Story de regressão verifica scrollWidth/clientWidth com resumo longo. Resultado final registrado na integração. Typecheck e ESLint de pets/navigation/ConfirmDialog/ChoiceCardGroup aprovados antes desse ajuste de CSS.

## E2E da integração (26/10/2026)

Worktree isolada de validação a partir da dev integrada, Next webpack na porta 3180 e backend simulado na 5099, preservando o servidor do usuário na 3000. Comando: `node node_modules/@playwright/test/cli.js test --config playwright.recovery.tmp.config.ts e2e/mocked/bookings/my-stays.spec.ts e2e/mocked/search/listing-page.spec.ts e2e/mocked/pets/new-pet.spec.ts e2e/mocked/pets/pet-profile.spec.ts --grep "REQ-STAYS-001|REQ-STAYS-006|REQ-LPAGE-001|REQ-PNEW-016|REQ-PEDIT-004" --project=mocked-desktop --project=mocked-mobile --workers=1` (segunda rodada com `--last-failed`, que executou novamente os dez casos). **10/10 aprovados, 2,9 min na segunda rodada**.

Primeira rodada: timeouts de navegação/compilação em rotas frias no desktop e seletor novo de cancelamento que buscava texto isolado apesar da vírgula acessível no marcador. Seletor corrigido para conferir o marco Cancelada/parou; a repetição passou sem aumentar os timeouts. Logs de desenvolvimento também registraram falha ao carregar Stripe.js externo; esses casos não validam o SDK real nem pagamento. Backend simulado não equivale à integração com API real. Configuração temporária removida na entrega; resultados locais em `.agent-tools/recovery-e2e-repeat.log`, fora do Git.

## Atalhos de Alimentação e Manias

`node node_modules/vitest/vitest.mjs run src/features/pets/components/client/PetWizard.test.tsx -t "chips inserem" --maxWorkers=1`: **1 teste pertinente aprovado** (12 outros casos filtrados). Cobre conjuntos diferentes por campo, preservação de texto manual, inserção sem duplicar e independência entre alimentação/manias. `node node_modules/vitest/vitest.mjs run --config vitest.storybook.config.ts src/features/pets/components/client/PetWizard.stories.tsx -t "Passo 5" --maxWorkers=1`: **1 story Rotina aprovada com axe** (11 outras filtradas). Sem mudança de API; E2E anterior cobriu a jornada de cadastro, sem nova rodada artificial por mudança de sugestões.

Após integrar a 107, PetEditor.int e PetWizard.int passaram com **25 testes em 2 arquivos**. Typecheck/ESLint finais aprovados na composição; nenhum script temporário foi incluído no Git.
