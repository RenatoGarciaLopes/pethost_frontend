---
spec: 032-admin-accounts
status: in-progress
updated: 2026-10-15
area: AACC
---

# 032 · Admin: contas

## Contexto

O admin precisa tirar uma conta do ar (suspender), devolvê-la e resolver a **disputa de CPF**: a pessoa recebe "Esse CPF já está em outra conta", procura o suporte, o admin confere o documento, suspende a conta indevida e libera o CPF para o dono de verdade se cadastrar (`modulo-owners.md` seção 3.7). No anfitrião, a liberação vale para CPF e CNPJ (`modulo-hosts.md` seção 4.2). Toda ação leva motivo e vai para a trilha.

A tela mostra dado pessoal de outra pessoa (CPF completo, endereço, telefone). Cada leitura fica na trilha (`owner.viewed`, `host.viewed`); a tela mostra o mínimo por padrão.

## Referências

- **Design:** sem board próprio, conforme decisão de produto. Usar a composição sóbria da 031 e registrar aqui os estados e a validação visual feita na execução coordenada.
- **API:**
  - Tutores (`pethost_backend/docs/modulo-owners.md` seções 3.1, 3.6 e 3.7): `GET /api/v1/owners` (array, mais novos primeiro, sem paginação), `GET /api/v1/owners/{ownerId}`, `POST /api/v1/owners/{ownerId}/suspension` (`{ reason }`), `DELETE /api/v1/owners/{ownerId}/suspension` sem corpo, `POST /api/v1/owners/{ownerId}/cpf-release` (`{ reason }`, só de suspenso). Erros: `VALIDATION_ERROR` (`reason`), `OWNER_NOT_FOUND` 404, `OWNER_SUSPENSION_REQUIRED` 422, `OWNER_CPF_RELEASED` 422, `AUTH_ADMIN_SUSPENSION_FORBIDDEN` 403.
  - Anfitriões (`modulo-hosts.md` seções 3 e 4.2): ✅ `GET /api/v1/hosts`, ✅ `GET /api/v1/hosts/{hostId}`, ✅ `POST` e `DELETE /api/v1/hosts/{hostId}/suspension`, ✅ `POST /api/v1/hosts/{hostId}/identity-release`. Erros: `HOST_NOT_FOUND` 404, `HOST_SUSPENSION_REQUIRED` 422, `HOST_IDENTITY_RELEASED` 422.
  - Formatos: tutor `{ id, userId, cpf?, isActive, suspendedAt?, createdAt, user }`; anfitrião `{ id, userId, personType, cpf, company?, verifiedAt, isActive, suspendedAt?, identityReleasedAt?, stripeConnected, stripePayoutsEnabled, createdAt, user }`; motivo da suspensão em `user.suspensionReason`.
- **Depende de:** 003, 004 (casca de admin) e 031 (`AdminDataTable`, `ReasonField`, `paginate`, `useSearchParamsState`, padrão `DecisionPanel`). A 033 preencherá o slot de auditoria desta tela.

## Histórias

- Como admin, quero achar uma conta pelo nome, e-mail ou CPF.
- Como admin, quero suspender uma conta com motivo e saber o que isso faz com a pessoa.
- Como admin, quero liberar um CPF em disputa, entendendo que não tem volta.
- Como admin, quero ver o que já foi feito com aquela conta.

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-AACC-001 | O SISTEMA DEVE mostrar em `/admin/users` duas abas, Tutores e Anfitriões, com a aba na URL (`?type=owners` ou `hosts`)                                                                                                                                                                       |
| REQ-AACC-002 | Cada lista DEVE mostrar nome, e-mail, CPF mascarado, status (ativa, inativa, suspensa, identidade liberada) e data de criação; no anfitrião, também pessoa física ou empresa (nome fantasia) e se recebe pelo Stripe                                                                         |
| REQ-AACC-003 | O SISTEMA DEVE filtrar no cliente por nome, e-mail ou CPF (dígitos, com ou sem máscara) e por status, com paginação de 25 (a API não pagina nem filtra texto/status); status e página ficam na URL, o texto buscado NÃO (pode conter CPF)                                                    |
| REQ-AACC-004 | O detalhe (`/admin/users/owners/[ownerId]` ou `/admin/users/hosts/[hostId]`) DEVE mostrar os dados da conta, o status, o motivo e a data da suspensão quando houver, e o CPF mascarado com "Mostrar"                                                                                         |
| REQ-AACC-005 | QUANDO o admin suspender, O SISTEMA DEVE pedir o motivo (1 a 500) e explicar o efeito ("a pessoa sai na hora e não entra com a senha até você tirar a suspensão") antes de confirmar                                                                                                         |
| REQ-AACC-006 | QUANDO o admin tirar a suspensão, O SISTEMA DEVE confirmar e avisar que a pessoa recebe um e-mail e volta ao status que tinha                                                                                                                                                                |
| REQ-AACC-007 | "Liberar CPF" (tutor) e "Liberar identidade" (anfitrião: CPF, e CNPJ na empresa) DEVEM aparecer só em conta suspensa, pedir motivo e uma confirmação reforçada (digitar "LIBERAR") dizendo que a conta não volta mais                                                                        |
| REQ-AACC-008 | ENQUANTO a identidade estiver liberada, O SISTEMA NÃO DEVE oferecer "Tirar suspensão" e DEVE explicar por quê                                                                                                                                                                                |
| REQ-AACC-009 | O detalhe DEVE expor o slot opcional `auditTrail` e o link "Ver na trilha" para `/admin/audit-entries?targetType={owner\|host}&targetId={id}`. A composição da rota passa ao slot a tabela compacta da 033, com `targetType` e `targetId` fixos, e essa feature controla a própria consulta. |
| REQ-AACC-010 | QUANDO uma ação der certo, O SISTEMA DEVE atualizar o detalhe e a lista sem recarregar a página e anunciar o resultado (`role="status"`)                                                                                                                                                     |
| REQ-AACC-011 | SE a API recusar a ação (`*_SUSPENSION_REQUIRED`, `OWNER_CPF_RELEASED`, `HOST_IDENTITY_RELEASED`, `AUTH_ADMIN_SUSPENSION_FORBIDDEN`, `HOST_STRIPE_ACCOUNT_NOT_REJECTED`), O SISTEMA DEVE mostrar a frase de `getErrorMessage` e recarregar o detalhe                                         |
| REQ-AACC-012 | A partir da 031, o caso "CPF ou CNPJ já pertence a outro anfitrião" DEVE ter atalho para a conta dona do documento quando ela aparecer na lista                                                                                                                                              |
| REQ-AACC-013 | Toda ação DEVE ser possível só com teclado, com os diálogos prendendo o foco e devolvendo-o ao botão de origem                                                                                                                                                                               |

## Estados da tela

| Estado                              | O que aparece                                                   |
| ----------------------------------- | --------------------------------------------------------------- |
| Carregando                          | `SniffLoader`                                                   |
| Lista vazia ou filtro sem resultado | `EmptyState` "Nenhuma conta com esse filtro" + "Limpar filtros" |
| Conta suspensa                      | `StatusPill` suspensa + motivo e data + ações de suspensão      |
| Identidade liberada                 | `Notice` "Identidade liberada em <data>. Essa conta não volta." |
| Erro                                | `ErrorState`                                                    |

## Fora do escopo

- Editar dados da conta pelo admin (a API não tem).
- Contas de anfitrião ainda em verificação: aparecem só na fila (031), porque `GET /hosts` lista só anfitriões aprovados.
- Canal de suporte por onde a pessoa abre a disputa.

## Divergências vault × API e com o roadmap

- O roadmap previa `/admin/users/[userId]`, mas a API identifica o tutor pelo `ownerId` e o anfitrião pelo `hostId`, e não tem rota por conta. A spec usa `/admin/users/owners/[ownerId]` e `/admin/users/hosts/[hostId]`.
- O vault não descreve a tela (não há board).

## Decisões fechadas

- Não criar board próprio para esta spec; seguir a composição sóbria da 031.
- O detalhe aceita `auditTrail?: ReactNode` e aponta "Ver na trilha" para `/admin/audit-entries?targetType=owner|host&targetId={id}`. Os nomes exatos são `targetType` e `targetId`, conforme GET `/audit-entries`.
- A rota compõe o slot com `AuditTable` da 033 (`variant="compact"`, `fixedFilters` do perfil). O widget 032 não importa a feature de auditoria; `AuditTable` administra sua própria query e invalidação.
- A decisão de retirar suspensão não envia motivo: DELETE não tem body no contrato real. A interface confirma e explica o efeito.

## Perguntas em aberto

1. **Suspender quem ainda está em verificação:** sem perfil de anfitrião não há `hostId`, e a API não tem suspensão por conta. Hoje o admin só consegue recusar a verificação. Pedir ao backend uma rota de suspensão por `userId`?
2. **Admin listado?** A API não lista contas de admin; fica fora da tela.
3. **Busca no servidor:** com muitas contas, a lista inteira pesa e cada carga grava `owner.listed`. Pedir paginação e busca ao backend (por POST ou cabeçalho, para o CPF não ir na URL).
4. **Mesma pessoa nas duas abas:** mostrar o vínculo (mesmo e-mail) entre o tutor e o anfitrião? A API não liga os dois; dá para cruzar pelo `user.email` no cliente.

## Atualização da API aprovada em 15/10/2026

- GET /hosts aceita stripeStatus: not_started, in_progress, under_review, restricted, rejected e enabled. O filtro de recebimento vai à API e à URL; a busca pessoal continua somente em memória. A API rejeita valor desconhecido com 400 em stripeStatus; o frontend normaliza para todos.
- POST /hosts/{hostId}/stripe-account-reset recebe reason obrigatório de 1 a 500 caracteres. Só aceita conta recusada (rejected); outra situação retorna 422 HOST_STRIPE_ACCOUNT_NOT_REJECTED. Desvincula a conta recusada, preserva o histórico e devolve stripeStatus not_started, sem criar conta Stripe nem liberar repasses nesta ação. A próxima abertura do cadastro de recebimento criará outra conta. O reset não retira suspensão.
- DELETE /owners/{id}/suspension e DELETE /hosts/{id}/suspension não recebem corpo nem motivo na API real. A interface pede confirmação com o efeito e o aviso de e-mail, sem inventar reason para esses DELETE.
- A tarefa foi autorizada sem board próprio. Composição sóbria e responsiva segue a 031; revisão visual permanece na execução coordenada. Não há alegação de canvas renderizado.

### Novos critérios

| ID           | Critério                                                                                                                                                                                                                                                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-AACC-014 | Na aba Anfitriões, o filtro Cadastro de recebimento DEVE listar Todos e os seis status conhecidos, manter stripeStatus na URL e pedir GET /hosts?stripeStatus= quando selecionado. Trocar filtro volta à página 1. Na aba Tutores não envia filtro Stripe.                                                                                               |
| REQ-AACC-015 | Em anfitrião com Stripe rejected e identidade não liberada, o admin DEVE poder dar nova chance ao cadastro de recebimento, com motivo e confirmação explicando histórico, retorno a not_started e nova conta somente na próxima abertura do cadastro. A ação não promete liberar repasses nem retirar suspensão; fraude pede suspensão, não nova chance. |
| REQ-AACC-016 | Sucesso do reset DEVE atualizar detalhe e invalidar todas as listas de anfitriões (inclusive filtros Stripe); `HOST_STRIPE_ACCOUNT_NOT_REJECTED` DEVE mostrar orientação específica e reler detalhe, sem retry automático. A consulta de auditoria é mantida pela 033.                                                                                   |
