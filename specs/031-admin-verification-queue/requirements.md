---
spec: 031-admin-verification-queue
status: in-progress
updated: 2026-10-15
area: AQUEUE
---

# 031 · Admin: fila e decisão da verificação

## Contexto

A equipe da PetHost confere quem quer ser anfitrião: compara o documento e a selfie com os dados da conta e aprova ou recusa, sempre com motivo. É a porta de confiança do produto (`design/04-confianca.md`: "anfitrião verificado"). A tela é de trabalho: sóbria, rápida de usar em sequência, sem personalidade (intensidade zero).

As fotos são dado sensível: o admin só as vê por um link que vence em 5 minutos, pedido quando abre a foto; o link nunca é guardado.

## Referências

- **Design:** canvas "PetHost · Resultados de cantinhos", board `Fluxo-Admin` → "Fila" e "Conferir e decidir" (computador; celular só leitura). Vault: `design/21-mapa-de-telas.md` (Fluxo-Admin: "Fotos com aviso de link que vence; dados da conta lado a lado; checklist; aprovar com motivo; recusas em chips; fraude separada").
- **API** (`pethost_backend/docs/modulo-hosts.md` seções 3, 3.4 e 5):
  - ✅ `GET /api/v1/host-applications?status=` (padrão `submitted`, mais antigas primeiro; **sem paginação**);
  - ✅ `GET /api/v1/host-applications/{applicationId}` (com `user`, `documents[].path`, `reviewNotes`, `reviewedBy`, `noticeVersion`, `noticeAcceptedAt`);
  - ✅ `GET /api/v1/host-applications/{applicationId}/documents/{kind}` → `{ kind, url, expiresAt }` (5 min, `no-store`; cada pedido vai para a trilha);
  - ✅ `POST .../approval` `{ reason }` e `POST .../rejection` `{ rejectionReason, reason }` (`reason` obrigatório, até 500);
  - Erros: `VALIDATION_ERROR` 400, `HOST_APPLICATION_NOT_FOUND` 404, `HOST_APPLICATION_CONFLICT` 409, `HOST_CPF_ALREADY_REGISTERED` 409, `HOST_CNPJ_ALREADY_REGISTERED` 409, `HOST_APPLICATION_NOT_UNDER_REVIEW` 422.
- **Vault:** `produto/contrato-api.md` (Admin e motivos de recusa).
- **Depende de:** 003 (`bffClient`, `getErrorMessage`, `REQ-HTTP-019`), 004 (casca de admin, `requireRole("admin")`), 002 (`StatusPill`, `Notice`, `EmptyState`, `ErrorState`, `ChipPicker`). A 031 deriva seus contratos do gerado e mantém copy administrativa própria, sem importar a 030 (decisão de 14/10/2026).

## Histórias

- Como admin, quero ver primeiro quem espera há mais tempo.
- Como admin, quero comparar documento, selfie e dados da conta lado a lado, com um checklist, para decidir com segurança.
- Como admin, quero recusar com um motivo que a pessoa entenda, e separar a suspeita de fraude.
- Como admin, quero saber se outra pessoa da equipe decidiu antes de mim.

## Critérios de aceite

| ID             | Critério                                                                                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-AQUEUE-001 | O SISTEMA DEVE listar em `/admin/host-applications` as solicitações do status escolhido (padrão `submitted`), mais antigas primeiro, com nome, pessoa física ou empresa, tentativa, tempo de espera e status                                                                                                        |
| REQ-AQUEUE-002 | O filtro de status DEVE ficar na URL (`?status=`) e aceitar só os status conhecidos; valor desconhecido volta ao padrão                                                                                                                                                                                             |
| REQ-AQUEUE-003 | ENQUANTO a lista tiver mais de 25 itens, O SISTEMA DEVE paginar no cliente (a API não pagina), com a página na URL                                                                                                                                                                                                  |
| REQ-AQUEUE-004 | QUANDO a fila estiver vazia, O SISTEMA DEVE mostrar "Ninguém esperando agora" (`EmptyState`)                                                                                                                                                                                                                        |
| REQ-AQUEUE-005 | O detalhe DEVE mostrar lado a lado os dados enviados (CPF, tipo de documento, empresa) e os da conta (nome, nascimento, e-mail, telefone, endereço), a versão e a data do aceite do aviso e a tentativa                                                                                                             |
| REQ-AQUEUE-006 | QUANDO o admin abrir uma foto, O SISTEMA DEVE pedir o link naquela hora e mostrar a imagem com o aviso "Esse link vence em M:SS"; ao vencer, a imagem some e aparece "Abrir de novo"                                                                                                                                |
| REQ-AQUEUE-007 | O link assinado NUNCA DEVE ir para storage, URL da página, query key persistida, log ou cache do navegador; no cache do Query vale só enquanto a foto está aberta                                                                                                                                                   |
| REQ-AQUEUE-008 | O SISTEMA DEVE mostrar o checklist (nome e nascimento batem, CPF bate, rosto do documento é o da selfie, selfie segurando o documento, documento na validade, 18+); na empresa, também CNPJ ativo na Receita, razão social e endereço batendo e representante no quadro de sócios, com link para a consulta pública |
| REQ-AQUEUE-009 | "Aprovar" DEVE ficar travado até o checklist inteiro ser marcado e o motivo (1 a 500 caracteres) preenchido                                                                                                                                                                                                         |
| REQ-AQUEUE-010 | "Recusar" DEVE pedir um motivo em chips (`document_illegible`, `document_expired`, `selfie_mismatch`, `data_mismatch`, `missing_document`, `other`), mostrando a frase que a pessoa vai ler, e a nota interna (1 a 500)                                                                                             |
| REQ-AQUEUE-011 | "Suspeita de fraude" DEVE ficar separada da recusa comum, com confirmação explícita de que a pessoa não poderá tentar de novo, e mandar `rejectionReason: "suspected_fraud"`                                                                                                                                        |
| REQ-AQUEUE-012 | QUANDO a decisão der certo, O SISTEMA DEVE avisar e oferecer "Próxima da fila" (a mais antiga ainda em `submitted`)                                                                                                                                                                                                 |
| REQ-AQUEUE-013 | SE a API responder `HOST_APPLICATION_CONFLICT` ou `HOST_APPLICATION_NOT_UNDER_REVIEW`, O SISTEMA DEVE recarregar o detalhe e dizer "Outra pessoa da equipe já decidiu essa verificação"                                                                                                                             |
| REQ-AQUEUE-014 | ENQUANTO a solicitação não estiver em `submitted`, o painel de decisão NÃO DEVE aparecer; aparecem a decisão, o motivo, a nota (`reviewNotes`), quem decidiu e quando                                                                                                                                               |
| REQ-AQUEUE-015 | QUANDO as fotos já tiverem sido apagadas (`documentsPurgedAt`), O SISTEMA DEVE mostrar "Fotos apagadas em <data>" no lugar das vagas                                                                                                                                                                                |
| REQ-AQUEUE-016 | O detalhe DEVE funcionar com teclado: chips e checklist navegáveis, foto aberta em diálogo que prende o foco e fecha com Esc                                                                                                                                                                                        |

## Estados da tela

| Estado                      | O que aparece                          |
| --------------------------- | -------------------------------------- |
| Carregando lista ou detalhe | `SniffLoader`                          |
| Fila vazia                  | `EmptyState` "Ninguém esperando agora" |
| Foto carregando             | Esqueleto na vaga                      |
| Link vencido                | Vaga vazia + "Abrir de novo"           |
| Foto apagada                | "Fotos apagadas em <data>"             |
| Decidida                    | Resumo da decisão, sem painel          |
| Conflito                    | `Notice` + detalhe recarregado         |
| Erro                        | `ErrorState` com "Tentar de novo"      |

## Fora do escopo

- Suspender anfitrião já aprovado e liberar identidade (spec 032).
- Trilha de auditoria da solicitação (033; o detalhe pode linkar para a trilha filtrada).
- Consulta automática do CNPJ (é manual, pelo link público).

## Divergências vault × API

- O vault fala em "Fila" sem paginação; a API não pagina, então a paginação é no cliente (REQ-AQUEUE-003).
- O OpenAPI marca `reason` e `rejectionReason` como anuláveis; a API exige os dois. O front valida como obrigatórios.

## Perguntas em aberto

1. **Volume da fila:** sem paginação na API, a lista inteira vem a cada carga. Pedir paginação ao backend quando passar de algumas centenas.
2. **Celular (resolvido em 14/10/2026):** fila e detalhe continuam legíveis; decisão disponível somente em tela com largura de pelo menos 900px. Abaixo disso aparece "Pra decidir, abre num computador".
3. **Checklist (resolvido em 14/10/2026):** somente memória da tela, sem envio à API. O registro do que foi conferido fica no `reason`.
