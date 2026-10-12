---
spec: 030-host-verification
status: draft
updated: 2026-10-11
area: HVER
---

# 030 · Minha verificação (anfitrião)

## Contexto

Primeira das três etapas para virar anfitrião: **1. Mostrar quem eu sou** → 2. Como eu recebo (043) → 3. Montar meu cantinho (044). Quem preenche é a persona Dona Cida (58 anos, "não é da tecnologia", para no meio e volta outro dia; `produto/personas.md`). Os medos aqui são "pra que querem minha foto?" e "e se eu errar?". A tela precisa explicar antes de pedir, aceitar a volta no dia seguinte e tratar recusa como "foto ruim", nunca como culpa.

A selfie com o documento é dado pessoal sensível (LGPD art. 5º, II; base art. 11, II, "g"): as fotos nunca saem da memória do formulário até o envio.

## Referências

- **Design:** canvas "PetHost · Resultados de cantinhos", board `Fluxo-Verificacao` (computador 1440 e celular 390): "Os 3 passos", "Antes de começar", "Documento e CPF", "Fotos", "Em análise", "Recusada", "Aprovada". Vault: `design/19-abrir-meu-cantinho.md` (etapa 1), `design/04-confianca.md`, `design/17-cadastros-e-formularios.md`, `design/02-orcamento-de-personalidade.md` (intensidade zero, aprovação média).
- **API** (`pethost_backend/docs/modulo-hosts.md` seções 1, 3.1 a 3.3, 4 e 5):
  - ✅ `GET /api/v1/hosts/me/application` → `{ application?, canStartNew, remainingAttempts, noticeVersion }`;
  - ✅ `POST /api/v1/hosts/me/application` `{ personType?, cpf, documentType, acceptNotice: true, cnpj?, legalName?, tradeName?, companyAddress? }` → 201;
  - ✅ `PATCH /api/v1/hosts/me/application` (parcial, só no rascunho);
  - ✅ `PUT /api/v1/hosts/me/application/documents` (multipart `front`, `back`, `selfie`; tudo ou nada; 5 MB cada; corpo até 24 MB);
  - ✅ `POST /api/v1/hosts/me/application/submission` (exige as 3 fotos);
  - ✅ `DELETE /api/v1/hosts/me/application` (desiste no rascunho ou em análise; fotos apagadas).
  - Erros: `HOST_APPLICATION_ALREADY_EXISTS` 409, `HOST_CPF_ALREADY_REGISTERED` 409, `HOST_CNPJ_ALREADY_REGISTERED` 409, `HOST_ALREADY_VERIFIED` 422, `HOST_APPLICATION_BLOCKED` 422, `HOST_APPLICATION_ATTEMPTS_EXCEEDED` 422, `HOST_APPLICATION_NOT_EDITABLE` 422, `HOST_APPLICATION_COMPANY_DATA_NOT_ALLOWED` 422, `HOST_APPLICATION_DOCUMENT_ALREADY_EXISTS` 409, `VALIDATION_ERROR` 400 (campo da parte: `front`, `back`, `selfie`, `documents`), 413.
- **Vault:** `produto/contrato-api.md` (verificação e motivos de recusa), `produto/escopo-oficial.md`.
- **Depende de:** 002 (`WizardProgress`, `ChoiceCardGroup`, `SegmentedControl`, `MaskedTextField`, `Notice`, `Hint`, `StatusPill`, `Celebration`), 003 (`bffClient`, `getErrorMessage`, `applyFieldErrors`, `accountQueryKey`), 004 (`requireRole("host")`, `NAV_ITEMS`), 011 (máscaras de CPF/CNPJ e preenchimento por CEP), 022 (`PhotoSlots`, se entregue antes; senão esta spec cria a base de `DocumentSlot`).

## Histórias

- Como pessoa que quer ser anfitriã, quero entender para que servem as fotos antes de mandar qualquer coisa.
- Como pessoa que parou no meio, quero voltar outro dia e continuar de onde parei.
- Como pessoa recusada, quero saber o que fazer diferente e quantas tentativas ainda tenho.
- Como empresa de hospedagem, quero informar os dados da empresa sem misturar com os meus.

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-HVER-001 | O SISTEMA DEVE mostrar em `/host/application` o painel das três etapas (verificação, recebimento, cantinho), com só a primeira liberada enquanto a verificação não for aprovada; as outras aparecem travadas com o que falta                                                                                                      |
| REQ-HVER-002 | QUANDO não houver solicitação e `canStartNew` for verdadeiro, O SISTEMA DEVE oferecer "Começar", que abre "Antes de começar"                                                                                                                                                                                                      |
| REQ-HVER-003 | "Antes de começar" DEVE mostrar o aviso de uso das fotos (versão `noticeVersion`), a escolha Pessoa física / Empresa e o "Li e concordo"; sem marcar, NÃO DEVE avançar, e o erro diz o que falta                                                                                                                                  |
| REQ-HVER-004 | O passo "Seus dados" DEVE pedir CPF (máscara, dígitos verificadores conferidos no cliente) e o tipo de documento em 3 cartões (RG, CNH, CIN); na empresa, também CNPJ (aceita alfanumérico), razão social, nome fantasia e endereço da empresa com preenchimento por CEP                                                          |
| REQ-HVER-005 | QUANDO "Seus dados" for confirmado pela primeira vez, O SISTEMA DEVE abrir a solicitação (`POST`); nas vezes seguintes, DEVE mandar só o que mudou (`PATCH`)                                                                                                                                                                      |
| REQ-HVER-006 | O passo "Fotos" DEVE ter três vagas (frente, verso, selfie segurando o documento), cada uma com o desenho do que se espera, as dicas ("de dia, perto da janela, sem flash, o documento inteiro") e "Tirar de novo"; no celular, a vaga abre a câmera (traseira para o documento, frontal para a selfie) e também aceita a galeria |
| REQ-HVER-007 | ANTES de enviar, O SISTEMA DEVE conferir no cliente o tipo (JPG, PNG, WebP) e reduzir a foto para no máximo 5 MB, sem metadados; SE não conseguir, DEVE dizer na vaga o que fazer, sem enviar                                                                                                                                     |
| REQ-HVER-008 | O SISTEMA DEVE enviar as fotos num pedido só (`PUT .../documents`) com as vagas preenchidas; QUANDO a API recusar uma parte, O erro DEVE aparecer na vaga certa (`field` = `front`, `back` ou `selfie`) e nenhuma vaga é dada como enviada                                                                                        |
| REQ-HVER-009 | As fotos e suas miniaturas DEVEM existir só na memória do formulário (`File` e `objectURL` revogado ao sair); NUNCA em store, storage, cache do Query, URL ou log                                                                                                                                                                 |
| REQ-HVER-010 | O passo "Confere e envia" DEVE mostrar as três miniaturas, o CPF mascarado e o tipo de documento; "Enviar pra análise" só habilita sem `missingDocuments`                                                                                                                                                                         |
| REQ-HVER-011 | ENQUANTO o status for `draft`, O SISTEMA DEVE mostrar o aviso "Sua verificação ficou pela metade. Ela vale até <dia da semana>." com a data de expiração (7 dias) e o caminho de volta ao passo que falta                                                                                                                         |
| REQ-HVER-012 | ENQUANTO o status for `submitted`, O SISTEMA DEVE mostrar a trilha Enviado → Em análise → Aprovado, a frase de espera e o "Desistir" discreto                                                                                                                                                                                     |
| REQ-HVER-013 | QUANDO a pessoa desistir, O SISTEMA DEVE pedir confirmação dizendo que as fotos serão apagadas e que desistir não gasta tentativa; depois, volta ao estado inicial                                                                                                                                                                |
| REQ-HVER-014 | QUANDO o status for `rejected`, O SISTEMA DEVE mostrar a frase do `rejectionReason` (tabela do contrato), o que fazer, "Tentar de novo" e "Você ainda tem N tentativas" (`remainingAttempts`), sem vermelho de erro                                                                                                               |
| REQ-HVER-015 | QUANDO o status for `rejected_final` ou `canStartNew` for falso por bloqueio ou tentativas esgotadas, O SISTEMA DEVE mostrar a frase de suporte e NÃO DEVE oferecer "Tentar de novo"                                                                                                                                              |
| REQ-HVER-016 | QUANDO o status for `approved`, O SISTEMA DEVE mostrar a conquista com o `Celebration` uma única vez por solicitação e liberar a etapa 2; nas visitas seguintes, só o estado "Aprovado"                                                                                                                                           |
| REQ-HVER-017 | QUANDO o status for `expired` ou `cancelled`, O SISTEMA DEVE explicar o que houve e oferecer começar de novo (sem gastar tentativa)                                                                                                                                                                                               |
| REQ-HVER-018 | Toda tela DEVE funcionar com teclado e leitor de tela: vagas de foto como botões com nome ("Foto da frente do documento, vazia"), progresso anunciado, foco no primeiro erro                                                                                                                                                      |
| REQ-HVER-019 | SE a API devolver erro de domínio, O SISTEMA DEVE mostrar a frase de `getErrorMessage` (códigos novos desta spec entram em `errorCopy.ts`)                                                                                                                                                                                        |

## Estados da tela

| Estado                            | O que aparece                                       |
| --------------------------------- | --------------------------------------------------- |
| Carregando                        | `SniffLoader` dentro da casca                       |
| Sem solicitação                   | Painel das 3 etapas + "Começar"                     |
| `draft`                           | Aviso amarelo-gema com a validade + passo que falta |
| `submitted`                       | Trilha + espera + "Desistir"                        |
| `rejected`                        | Motivo, o que fazer, tentativas, "Tentar de novo"   |
| `rejected_final` / sem tentativas | Frase de suporte, sem botão de nova tentativa       |
| `approved`                        | Conquista (uma vez) e etapa 2 liberada              |
| `expired` / `cancelled`           | Explicação + "Começar de novo"                      |
| Erro ao carregar                  | `ErrorState` com "Tentar de novo"                   |
| Enviando fotos                    | Barra de progresso por envio; botões travados       |

## Fora do escopo

- Etapa 2 (Stripe, spec 043) e etapa 3 (cantinho, spec 044): aqui só aparecem travadas.
- Perfil do anfitrião verificado e foto de perfil (spec 015).
- Lado do admin (spec 031).

## Divergências vault × API

- O vault (`19-abrir-meu-cantinho.md`) fala em "Desistir" só em análise; a API aceita desistir também no rascunho. A spec segue a API.
- O vault promete "a gente responde em até 2 dias úteis"; a API não tem prazo. A frase fica, mas precisa de confirmação do produto (pergunta 2).
- O vault cita "Tentar de novo" em toda recusa; com `suspected_fraud` a API fecha como `rejected_final`, sem nova tentativa.

## Perguntas em aberto

1. **Validade do rascunho:** a API não devolve `expiresAt`. O front calcula `createdAt + 7 dias`; confirmar com o backend se a contagem é a partir do `createdAt` ou do `updatedAt` (`DraftLifetimeDays` no `HostApplicationsPurgeService`). Melhor: o backend expor `expiresAt`.
2. **Prazo de resposta:** manter "em até 2 dias úteis"?
3. **Texto do aviso por versão:** o texto do aviso fica no front, indexado por `noticeVersion`. Se a API mudar a versão sem o front ter o texto, mostrar o texto mais recente e avisar no log de erro (sem dado pessoal)? Proposta: o backend expor o texto do aviso.
4. **Foto acima de 5 MB:** a compressão no navegador resolve a maioria das fotos de celular; confirmar se o backend aceita HEIC (iPhone). Hoje não aceita: o front converte para JPEG quando o navegador consegue decodificar e, se não, pede outra foto.
