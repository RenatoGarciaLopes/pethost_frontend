# Desenho

Reutilizados StepWizard/WizardProgress, ConfirmDialog, ChoiceCardGroup, PetProfileCard, useUnsavedChangesGuard e os formulários da 021; não há store, provider, HTTP ou endpoint novo.

WizardProgress recebe `navigation?: { onSelect, menuLabel, disabled? }`. Sem navigation mantém a trilha informativa de cadastro. Com navigation remove estados de conclusão e usa resumos salvos. No celular, Drawer inferior mantém sete destinos legíveis e acessíveis; ao escolher, o foco fica no título do destino; ao cancelar, volta ao botão. StepWizard apenas encaminha esse contrato e conserva aside.

PetEditor coordena índice da URL por useSyncExternalStore (popstate/hashchange e evento interno), rascunho, destino pedido e confirmação. EditSection hospeda PATCH/validação/erros existentes e expõe callbacks de salvo, ocupado e preview; PetStepHost entrega chrome/registro do form aos passos. usePetPreview observa RHF nos seis passos e publica valores parciais para a carteirinha, sem mudar valores aceitos no cadastro.

PetWizardScreen deixa de ter grade própria e carteirinha duplicada. WizardStepForm compõe StepWizard, título/foco, formulário, StepWizardActions e LivePetCard. Cada passo preserva sua validação; PetWizard preserva criação, envio/retry de fotos e rascunho. SpeciesStep usa a grade do ChoiceCardGroup nos dois modos. O cadastro de conta não foi alterado.

Limites: voltar do navegador continua seguindo o limite documentado de useUnsavedChangesGuard; query/hash de seção não é controle de permissão. Fotos são salvas imediatamente, sem botão Salvar artificial. Preview lateral aparece em lg; abaixo disso a revisão continua contendo a carteirinha. Sem nova dependência.
