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
