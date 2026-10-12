---
spec: 030-host-verification
status: draft
updated: 2026-10-11
---

# 030 · Design técnico

## Rota e renderização

| Arquivo                                          | Tipo           | Faz                                                                                                                                                                                               |
| ------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(host)/host/application/page.tsx`           | RSC dinâmico   | `requireRole("host", "/host/application")`; prefetch de `myApplicationQuery` no servidor (`createBackendClient`) e `HydrationBoundary`; renderiza `HostOnboardingPanel` + `ApplicationStatusView` |
| `app/(host)/host/application/new/page.tsx`       | RSC dinâmico   | Mesma guarda; sem solicitação aberta → `ApplicationWizard` no passo "Antes de começar"; com `draft` → redireciona para o passo que falta                                                          |
| `app/(host)/host/application/documents/page.tsx` | RSC dinâmico   | Só com `draft`; senão volta para `/host/application`. Renderiza o passo "Fotos" e "Confere e envia"                                                                                               |
| `loading.tsx` / `error.tsx`                      | da casca (004) |                                                                                                                                                                                                   |

Sem `'use cache'` (dados da própria pessoa). Metadados `robots: noindex`. O passo atual do assistente vem do estado do servidor (solicitação existe → dados feitos; `missingDocuments` vazio → confere), nunca de storage: a Dona Cida volta em outro aparelho e continua.

## Árvore de componentes

```
page /host/application (RSC)
├─ HostOnboardingPanel (widgets/host-onboarding · server)   as 3 etapas; 2 e 3 travadas (FlowSectionList)
└─ ApplicationStatusView (features/host-applications · client)  escolhe a vista pelo status
   ├─ EmptyApplication          "Começar"
   ├─ DraftReminder             Notice tom atenção + validade (draftExpiresAt)
   ├─ UnderReview               StatusTimeline + "Desistir" (CancelApplicationDialog)
   ├─ RejectionNotice           motivo → frase (rejectionCopy) + tentativas + "Tentar de novo"
   ├─ SupportOnlyNotice         rejected_final / sem tentativas
   ├─ ApprovedView              Celebration (uma vez) + link para a etapa 2
   └─ ClosedView                expired / cancelled + "Começar de novo"

page /host/application/new (RSC)
└─ ApplicationWizard (client)  WizardProgress: Antes de começar → Seus dados → Fotos → Confere
   ├─ NoticeStep         ApplicationNotice (texto por noticeVersion) + PersonTypeStep (SegmentedControl PF/Empresa) + aceite
   ├─ DataStep           MaskedTextField CPF · DocumentTypeStep (ChoiceCardGroup RG/CNH/CIN) · CompanyFields (só PJ, CEP)
   ├─ DocumentsStep      DocumentSlots → 3 × DocumentSlot (shared/ui/media) + Hint de dicas
   └─ ReviewStep         miniaturas, CPF mascarado, "Enviar pra análise"
```

## Contratos e modelos

| Símbolo                                                  | Onde                                       | Nota                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `myApplicationSchema`                                    | `features/host-applications/api/contracts` | `unwrapData(GetApiV1HostsMeApplicationResponse)` estreitado: `status` → `ApplicationStatus` (`draft`, `submitted`, `approved`, `rejected`, `rejected_final`, `cancelled`, `expired`), `personType` → `pf`/`pj`, `documentType` → `rg`/`cnh`/`cin`, `missingDocuments` → `DocumentKind[]` (`front`, `back`, `selfie`), `rejectionReason` → `RejectionReason` |
| `MyApplication`                                          | `features/host-applications/types`         | modelo de UI: `status`, `attemptNumber`, `missingDocuments`, `uploadedKinds`, `rejectionReason?`, `draftExpiresAt?` (`createdAt + 7 dias`, ver pergunta 1), `canStartNew`, `remainingAttempts`, `noticeVersion`                                                                                                                                             |
| `toMyApplication`                                        | `features/host-applications/api/mappers`   | DTO → modelo; nunca carrega CPF completo para o modelo de exibição (`cpfMasked`)                                                                                                                                                                                                                                                                            |
| `startApplicationSchema`                                 | `features/host-applications/schemas`       | `acceptNotice: z.literal(true)`, `personType`, `cpf` (`isValidCpf` de `shared/lib/cpf`), `documentType`, e na empresa `cnpj` (`isValidCnpj`, alfanumérico), `legalName`, `tradeName`, `companyAddress` (reuso do schema de endereço da 011)                                                                                                                 |
| `toStartApplicationRequest`, `toPatchApplicationRequest` | `api/mappers`                              | o PATCH leva só o que mudou (`diffFields`)                                                                                                                                                                                                                                                                                                                  |
| `documentUploadSchema`                                   | `schemas`                                  | por vaga: `File` com tipo `image/jpeg`, `image/png` ou `image/webp` e tamanho ≤ 5 MB **depois** do preparo                                                                                                                                                                                                                                                  |

Chamadas (todas pelo `bffClient`, caminhos da lista `bffRoutes`): `getMyApplication`, `startApplication`, `patchApplication`, `uploadDocuments(FormData)`, `submitApplication`, `cancelApplication` em `features/host-applications/api/client/myApplication.client.ts`. No servidor, `getMyApplicationServer` em `api/server` (prefetch).

## Fluxo de dados

- Query key: `accountQueryKey(user.id, "host-application", "me")`. `staleTime` padrão; `refetchOnWindowFocus` ligado só em `submitted` (a decisão pode chegar).
- Mutations: start, patch, upload, submit e cancel invalidam essa key. Upload e submit **não** são repetidos automaticamente (`retry: false`, padrão de mutation).
- Fotos: estado local do `DocumentsStep` (`useState<Record<DocumentKind, PreparedPhoto | undefined>>`), com `URL.createObjectURL` para a miniatura e `revokeObjectURL` no desmontar e ao trocar. O `FormData` é montado só na hora do envio.
- `prepareImageForUpload(file)` (`shared/lib/image`): decodifica, gira pela orientação, redimensiona até caber em 5 MB (lado máximo 2560 px, qualidade decrescente), reexporta como JPEG ou WebP (o que também tira o EXIF com GPS). Falha → erro tipado `IMAGE_UNREADABLE` ou `IMAGE_TOO_LARGE`.
- Celebração única: chave `pethost.celebrated.<applicationId>` no `localStorage` (só o id, não é dado sensível), com `try/catch`; sem storage, mostra uma vez por sessão.
- Upload passa pelo proxy em streaming (REQ-HTTP-014); 413 vira mensagem na tela.

## Erros

| Código                                                                 | Onde aparece                  | Texto                                                                                 |
| ---------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR` (`cpf`, `documentType`, `cnpj`, `companyAddress.*`) | campo, via `applyFieldErrors` | mensagem do campo                                                                     |
| `VALIDATION_ERROR` (`front`, `back`, `selfie`, `documents`)            | vaga da foto                  | "Essa foto não deu certo. Tira outra, de dia e sem flash."                            |
| `HOST_APPLICATION_DOCUMENT_ALREADY_EXISTS`                             | vaga                          | frase existente no `errorCopy`                                                        |
| `HOST_CPF_ALREADY_REGISTERED`                                          | campo CPF + `Notice`          | frase existente                                                                       |
| `HOST_CNPJ_ALREADY_REGISTERED`                                         | campo CNPJ                    | **nova:** "Esse CNPJ já está em outra conta. Se a empresa é sua, fala com o suporte." |
| `HOST_APPLICATION_ALREADY_EXISTS`                                      | volta ao status               | **nova:** "Você já tem uma verificação aberta. Vamos continuar de onde parou."        |
| `HOST_ALREADY_VERIFIED`                                                | `/host/application`           | **nova:** "Sua verificação já foi aprovada."                                          |
| `HOST_APPLICATION_NOT_EDITABLE`                                        | Notice                        | **nova:** "Essa verificação já foi enviada e não dá mais pra mudar."                  |
| `HOST_APPLICATION_COMPANY_DATA_NOT_ALLOWED`                            | Notice                        | **nova:** "Dados de empresa só valem pra verificação de empresa."                     |
| `HOST_APPLICATION_BLOCKED`, `HOST_APPLICATION_ATTEMPTS_EXCEEDED`       | `SupportOnlyNotice`           | frases existentes                                                                     |
| 413 / `PAYLOAD_TOO_LARGE`                                              | Notice no passo               | **nova:** "As fotos ficaram grandes demais juntas. Tira de novo com menos zoom."      |

Motivos de recusa (`rejectionCopy` em `features/host-applications/lib`, tabela de `produto/contrato-api.md`): `document_illegible`, `document_expired`, `selfie_mismatch`, `data_mismatch`, `missing_document`, `other`; desconhecido → frase de `other`. `suspected_fraud` nunca chega como `rejected` (vira `rejected_final`).

## Privacidade

- Fotos e miniaturas só em memória (REQ-HVER-009); o teste `no-token-storage.test.ts` ganha o padrão `documentPhoto|selfie` para storage e Zustand.
- Nenhuma foto em log, em mensagem de erro ou em query key. O `ErrorState` nunca mostra o corpo da requisição.
- O CPF aparece mascarado fora do campo de edição (`maskCpf`).
- A pessoa nunca recebe link das fotos (a API não devolve); o front não tenta mostrar fotos enviadas, só "Foto da frente enviada ✓".

## Reutiliza

`bffClient`, `createBackendClient`, `accountQueryKey`, `getErrorMessage`, `applyFieldErrors`, `requireRole`, `WizardProgress`, `FlowSectionList`, `ChoiceCardGroup`, `SegmentedControl`, `MaskedTextField`, `Notice`, `Hint`, `StatusTimeline`, `Celebration`, `ErrorState`, `SniffLoader`, `isValidCpf`/`maskCpf`, `isValidCnpj`, preenchimento por CEP (011), `PhotoSlots` (022) como base de `DocumentSlot` se já existir.

## Cria de reutilizável

| Recurso                                                          | Onde                                                        | Quem mais usa                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `DocumentSlot` (vaga com desenho, câmera, trocar, erro por vaga) | `shared/ui/media`                                           | `PhotoSlots` (021/022), `AvatarUploader` (015)                |
| `prepareImageForUpload`                                          | `shared/lib/image`                                          | fotos do pet (021/022), avatar (015), fotos do cantinho (044) |
| `StatusTimeline`                                                 | `shared/ui/data-display`                                    | estadias (052, 054)                                           |
| `HostOnboardingPanel`                                            | `widgets/host-onboarding`                                   | 043, 044 ligam as etapas 2 e 3                                |
| `rejectionCopy`, `applicationStatusLabel`                        | `features/host-applications/lib` (exportados no `index.ts`) | 031 (admin)                                                   |
| `ApplicationStatus`, `DocumentKind`, `RejectionReason`           | `features/host-applications/types`                          | 031                                                           |

## Matriz de testes

| REQ             | Nível                   | Arquivo                                                                                          | Caso                                                                                                                 |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 004/005         | Unitário                | `startApplicationSchema.test.ts`, `toPatchApplicationRequest.test.ts`                            | CPF inválido; PF com dado de empresa recusado; PJ exige empresa; PATCH só com o que mudou                            |
| 011/014/016     | Unitário                | `toMyApplication.test.ts`, `rejectionCopy.test.ts`                                               | validade = createdAt + 7 dias; todo motivo tem frase; desconhecido → `other`                                         |
| 007             | Unitário                | `prepareImageForUpload.test.ts` (canvas falso)                                                   | foto grande reduzida abaixo de 5 MB; tipo inválido → `IMAGE_UNREADABLE`; saída sem EXIF                              |
| 002/003/018     | Componente              | `NoticeStep.test.tsx`                                                                            | sem aceite não avança; foco no erro; PF/Empresa                                                                      |
| 006/008/009/018 | Componente              | `DocumentSlot.test.tsx`, `DocumentsStep.test.tsx`                                                | nome acessível por vaga; trocar revoga o objectURL; erro da API na vaga certa                                        |
| 010             | Componente              | `ReviewStep.test.tsx`                                                                            | botão travado com foto faltando; CPF mascarado                                                                       |
| 011 a 017       | Componente              | `ApplicationStatusView.test.tsx`                                                                 | uma vista por status; tentativas; sem "Tentar de novo" no final; celebração uma vez                                  |
| 005/008/013     | Integração (MSW no BFF) | `myApplication.client.int.test.ts`, `useUploadDocuments.int.test.tsx`                            | POST na primeira vez e PATCH depois; multipart com as partes certas; 409 de foto repetida; desistir invalida a query |
| 009             | Arquitetura             | `no-token-storage.test.ts` (ampliado)                                                            | nenhuma foto em storage, store ou log                                                                                |
| 001 a 018       | Storybook               | `ApplicationStatusView.stories.tsx`, `ApplicationWizard.stories.tsx`, `DocumentSlot.stories.tsx` | todos os status e passos, desktop e celular, a11y sem violação                                                       |
| 002 a 010       | E2E simulado            | `e2e/mocked/host/verification.spec.ts` (desktop e celular)                                       | começar, dados, 3 fotos (arquivos fictícios gerados no teste), enviar, ver "Em análise"; recusa com tentativas       |
| 002 a 012       | E2E real                | `e2e/real/host/verification.spec.ts`                                                             | conta de anfitrião de demonstração, documentos **fictícios**, até "Em análise"; desistir no fim para limpar          |
| 019             | Unitário                | `shared/api/errors/getErrorMessage.test.ts`                                                      | todo código novo da verificação tem frase em `errorCopy`                                                             |
