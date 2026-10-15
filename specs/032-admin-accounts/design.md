---
spec: 032-admin-accounts
status: in-progress
updated: 2026-10-15
---

# 032 · Design técnico

## Rotas e composição

| Rota                            | Composição                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin/users`                  | RSC protege com `requireRole("admin")`, valida `type`, `status`, `stripeStatus` e `page`, preenche a query de lista da aba, depois hidrata `AccountsDirectory`. |
| `/admin/users/owners/[ownerId]` | RSC valida UUID, busca o tutor pelo `ownerId` e hidrata `AccountDetail` com `kind="owners"`.                                                                    |
| `/admin/users/hosts/[hostId]`   | RSC valida UUID, busca o anfitrião pelo `hostId` e hidrata `AccountDetail` com `kind="hosts"`.                                                                  |

As três rotas ficam sob o painel de admin, usam `noindex` e mantêm a consulta dinâmica por requisição. A lista usa duas abas. A busca pessoal fica no estado React e não entra em URL, cache key ou log. Status e página ficam na URL. O filtro Stripe fica na URL e na chave da lista de anfitriões, e só então pede `GET /hosts?stripeStatus=`. Trocar de aba limpa os filtros e a busca. A busca permanece no componente pai enquanto uma nova lista carrega.

`AccountDetail` recebe `auditTrail?: ReactNode`; nesta entrega o slot fica vazio. "Ver na trilha" aponta para `/admin/audit-entries?targetType=owner|host&targetId={profileId}`, usando os nomes confirmados no contrato de `GET /audit-entries`. A feature 032 não consulta, implementa ou invalida a trilha. A 033 preenche o slot e gerencia sua própria query.

## Fronteiras e contratos

Os módulos independentes `features/owners` e `features/hosts` derivam seus schemas dos contratos gerados correspondentes. Eles exportam clientes, tipos, chaves e prefetch de servidor pela API pública da própria feature. Nenhuma feature importa a outra. O widget `widgets/admin-accounts` compõe as duas features e mantém o modelo de apresentação `AccountRow` no próprio domínio.

| Recurso                                                        | Localização                                 | Responsabilidade                                                                                                                                                        |
| -------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adminOwnerSchema` e `adminOwnerListSchema`                    | `features/owners/api/contracts.ts`          | Derivam o perfil e lista do contrato gerado `owners`; aceitam `user` ausente e CPF nulo/ausente como identidade liberada.                                               |
| `adminHostSchema`, `adminHostListSchema`, `stripeStatusSchema` | `features/hosts/api/contracts.ts`           | Derivam perfis do contrato gerado `hosts-admin`, preservam evidências após liberação e validam os seis valores do filtro Stripe.                                        |
| Clientes e queries de admin                                    | `features/{owners,hosts}/api`               | Enviam motivo validado para POST de suspensão/liberação/reset; DELETE de retirada de suspensão não tem corpo; listagem de anfitriões aceita o filtro Stripe.            |
| `AccountRow`, `toAccountRow`, `filterAccounts`                 | `widgets/admin-accounts/lib/accountRows.ts` | Modelo mínimo sem telefone/endereço. Prioridade de estado: identidade liberada, suspensa, inativa, ativa. Busca tolera acentos e caixa; CPF é comparado só com dígitos. |
| `accountsSearchSchema`                                         | `widgets/admin-accounts/schemas`            | Normaliza parâmetros públicos desconhecidos para valores seguros padrão. Não contém texto pessoal de busca.                                                             |
| `ReasonActionDialog`                                           | `shared/ui/feedback`                        | Diálogo controlado com motivo opcional por modo, efeito, erro, estado ocupado e confirmação de palavra literal.                                                         |
| `filterText` e `reasonSchema`                                  | `shared/lib/text` e `shared/lib/validation` | Normalização pura da busca e validação comum de motivo entre 1 e 500 caracteres após trim.                                                                              |

`useAccountAction` usa as operações da feature correspondente. Em sucesso grava a resposta do servidor no detalhe e invalida todas as listas daquela feature, incluindo cada chave de filtro Stripe. Nos erros de regra 403/422 atualiza o detalhe e invalida as listas para refletir o estado canônico. Não usa retry nem estado otimista. Erros 400 permanecem junto ao campo de motivo. Nenhuma ação toca a query da trilha.

## Interface e privacidade

`AccountsDirectory` usa o `AdminDataTable` compartilhado, colunas de nome, e-mail, CPF mascarado, status e criação. A aba anfitriões acrescenta pessoa física/empresa, nome fantasia, status Stripe e repasses. Status é filtrado em cliente; o Stripe é filtrado no servidor. Paginação local é de 25. Rótulos e selects têm associação explícita por `id`.

`AccountSummary` mostra telefone, nascimento e endereço apenas no detalhe. CPF/CNPJ ficam mascarados até ação explícita e o estado de revelação não é persistido. Contas liberadas mantêm a evidência no contrato; a tela informa data e motivo e oculta a ação de retirada da suspensão. Suspender pede motivo e explica o efeito. Retirar suspensão confirma o efeito e aviso de e-mail sem inventar corpo para DELETE. Liberar identidade pede motivo e `LIBERAR`. Dar nova chance ao Stripe aparece apenas para status `rejected` e identidade não liberada; a confirmação deixa claro que não libera repasses, não remove suspensão e que a próxima abertura criará outra conta Stripe.

## Testes e validação

| Camada                | Recursos cobertos                                                                             | Evidência                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Unitária              | `reasonSchema`, `filterText`, `accountsSearchSchema`, prioridade/normalização de `AccountRow` | Testes ao lado das funções; motivos vazios, limites 1/500/501, acentos, busca CPF mascarada e parâmetros inválidos.                       |
| Componente            | diálogo, diretório, ações e resumo                                                            | Testes ao lado dos componentes; busca sem URL, seletores públicos, status que permite ações, `LIBERAR`, privacidade e erros de validação. |
| Integração HTTP/cache | clientes de owners/hosts, `useAccountAction`, detalhe 032 e atalho de conflito 031            | MSW verifica corpo e verbo, filtro Stripe, resposta 422, invalidação de detalhe/listas e atalho sem documento na URL.                     |
| E2E simulado          | lista, CPF disputado, ações, Stripe e trilha                                                  | Escrito para execução coordenada; cobre fluxo da UI e backend simulado, não substitui API real.                                           |
| E2E real              | suspender e reativar tutor criado pelo próprio cenário                                        | Escrito para execução coordenada; pendente execução com API real e dados de teste autorizados.                                            |
| Storybook             | diálogo, diretório, ações, resumo e detalhe com slot vazio/opcional                           | Stories registram estados ativos, suspensos, liberados, empresa e Stripe recusado; E2E não substitui aceitação visual.                    |

Validação registrada será atualizada em `tasks.md` após os checks disponíveis nesta execução. A revisão visual, Storybook executado, E2E pelo navegador e integração real ficam para a execução coordenada pelo usuário.
