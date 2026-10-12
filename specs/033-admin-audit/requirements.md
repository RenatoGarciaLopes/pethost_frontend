---
spec: 033-admin-audit
status: draft
updated: 2026-10-11
area: AUDIT
---

# 033 · Admin: auditoria

## Contexto

A trilha responde "quem fez o quê, quando e por quê": ações do admin com motivo, logins recusados, troca de CPF, leituras de dado pessoal pelo admin (LGPD). Hoje ela só existe na API (`modulo-audit.md`, pendência 3: "Sem tela no admin"). A tela serve para investigar (ex.: vários logins recusados do mesmo IP, a disputa de CPF de um tutor) e é reaproveitada no detalhe de conta da 032.

## Referências

- **Design:** **sem board.** Mesmo padrão de tabela da 031 (`AdminDataTable`). Desenhar no canvas antes de `approved`.
- **API** (`pethost_backend/docs/modulo-audit.md` seções 2 e 4):
  - ✅ `GET /api/v1/audit-entries?page&pageSize&action&targetType&targetId&actorId&from&to` (só admin; mais novo primeiro; `pageSize` 1 a 100, padrão 20; `from`/`to` em ISO 8601);
  - resposta `{ items: [{ id, occurredAt, action, targetType, targetId, actorId, actorRole, reason, details, ipAddress, traceId }], page, pageSize, totalCount, totalPages }`;
  - `400 VALIDATION_ERROR` com todos os erros (`page`, `pageSize`, `from` depois de `to`); cada consulta grava `audit.searched`.
  - Ações conhecidas: as do `modulo-audit.md` seção 2 (`account.*`, `session.*`, `password.*`, `owner.*`, `audit.searched`) e as do `modulo-hosts.md` seções 4 e 4.2 (`host_application.*`, `host.*`).
- **Depende de:** 003, 004 (casca de admin), 031 (`AdminDataTable`, `useSearchParamsState`).
- **Usada por:** 032 (trilha da conta no detalhe), 031 (link para a trilha da solicitação).

## Histórias

- Como admin, quero filtrar por ação, alvo, quem fez e período para investigar um caso.
- Como admin, quero ler cada ação em português, com o motivo, sem decorar os códigos.
- Como admin, quero mandar a outra pessoa da equipe o link exato de uma busca.

## Critérios de aceite

| ID            | Critério                                                                                                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-AUDIT-001 | O SISTEMA DEVE listar em `/admin/audit-entries` os registros do mais novo para o mais antigo, com data e hora (fuso de Brasília), ação em português, alvo, quem fez (papel) e motivo                             |
| REQ-AUDIT-002 | Os filtros `action`, `targetType`, `targetId`, `actorId`, `from`, `to`, `page` e `pageSize` DEVEM ficar na URL e ser validados antes da chamada; valor inválido é descartado com aviso, sem chamar a API com ele |
| REQ-AUDIT-003 | O filtro de ação DEVE oferecer as ações conhecidas agrupadas (conta, sessão, senha, tutor, anfitrião, verificação, auditoria) e aceitar um código digitado                                                       |
| REQ-AUDIT-004 | O período DEVE ser escolhido em datas locais e enviado em ISO 8601 com fuso; SE `from` vier depois de `to`, O SISTEMA DEVE avisar no campo e não buscar                                                          |
| REQ-AUDIT-005 | O SISTEMA DEVE paginar pela API (`page`, `pageSize` 20, 50 ou 100), mostrando "N de M registros" a partir de `totalCount`                                                                                        |
| REQ-AUDIT-006 | QUANDO o admin abrir um registro, O SISTEMA DEVE mostrar os detalhes (`details` como lista chave e valor), o IP, o `traceId` (copiável) e os ids de alvo e autor                                                 |
| REQ-AUDIT-007 | O alvo e o autor DEVEM ser links: "filtrar por este" e, quando o tipo tiver tela (tutor, anfitrião, solicitação), "abrir" a tela correspondente (032, 031)                                                       |
| REQ-AUDIT-008 | Ação desconhecida pelo front DEVE aparecer com o código cru e um rótulo neutro, sem quebrar a tela                                                                                                               |
| REQ-AUDIT-009 | O SISTEMA DEVE oferecer `AuditTable` reutilizável, que recebe filtros fixos (ex.: `targetType` + `targetId`) e um modo compacto, para a 032                                                                      |
| REQ-AUDIT-010 | QUANDO não houver registro para o filtro, O SISTEMA DEVE mostrar "Nada registrado com esse filtro" e "Limpar filtros"                                                                                            |
| REQ-AUDIT-011 | A tabela DEVE ser navegável por teclado, com cabeçalhos de coluna marcados e a abertura do detalhe anunciada                                                                                                     |

## Estados da tela

| Estado          | O que aparece                                                                |
| --------------- | ---------------------------------------------------------------------------- |
| Carregando      | Esqueleto da tabela (a página anterior continua visível ao trocar de página) |
| Vazio           | `EmptyState` + "Limpar filtros"                                              |
| Filtro inválido | Aviso no campo; busca não sai                                                |
| Erro            | `ErrorState` com "Tentar de novo"                                            |

## Fora do escopo

- Exportar a trilha (CSV): a API não tem; fica para depois.
- Retenção e imutabilidade (pendências 1 e 2 do backend).

## Divergências

- O `modulo-audit.md` seção 2 lista só ações de conta, sessão, senha e tutor; as de anfitrião e verificação estão no `modulo-hosts.md`. A tabela de rótulos do front junta as duas fontes.
- O OpenAPI descreve `details` sem formato; a doc mostra objeto. O front aceita objeto de texto, número ou booleano e mostra o resto como JSON compacto.

## Perguntas em aberto

1. **IP na tela:** é dado pessoal. Mostrar só no detalhe (proposta) ou mascarar o último bloco por padrão?
2. **Lista de ações:** o backend pode expor as ações conhecidas (enum no OpenAPI) para o front não manter a lista à mão?
3. **Nome em vez de id:** a trilha traz só ids. Mostrar o nome do autor e do alvo exigiria uma chamada por id; proposta: só ids, com o link "abrir".
