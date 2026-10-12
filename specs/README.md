# Specs (Spec-Driven Development)

> Toda tela ou capacidade do frontend nasce de uma spec nesta pasta. O agente de IA **não escreve código sem uma spec `approved`** e segue as tarefas dela em TDD. A ordem das specs está em [roadmap.md](roadmap.md); as regras de código em [../docs/conventions.md](../docs/conventions.md).

## Por que assim

Desenvolvimento orientado por IA erra em dois lugares:

- **adivinhar o que não foi dito**, como estados de erro, microcopy ou permissões;
- **perder a ligação entre o pedido e o código.**

A spec fecha os dois buracos:

- cada critério de aceite tem um ID (`REQ-AUTH-003`);
- cada ID vira pelo menos um teste com esse ID no nome;
- cada tarefa aponta os IDs que entrega.

## Estrutura

```
specs/
  README.md            este processo
  roadmap.md           todas as telas, em fases, com API, design e dependências
  _templates/          requirements.md · design.md · tasks.md
  001-tooling-and-quality/
  002-design-system/
  003-http-and-session/
  010-login/
  ...
```

Numeração: `00x` são fundações (sem tela), `01x` em diante são telas, agrupadas por fase do roadmap.

## Os três arquivos

| Arquivo           | Pergunta que responde                                                                                                                                                                                                                                                      | Quem aprova               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `requirements.md` | **O quê** e **como saber que está certo**: histórias, critérios de aceite em formato EARS ("QUANDO … O SISTEMA DEVE …"), estados da tela, microcopy, acessibilidade, fora do escopo, referências de API e design                                                           | Renato (produto e design) |
| `design.md`       | **Como**: rota e modo de renderização, árvore de componentes por camada, contratos e mappers, fluxo de dados (query keys, mutations, invalidação), mapa de erros, o que reutiliza do catálogo, o que cria de reutilizável e a **matriz de testes** (REQ → nível → arquivo) | Revisão técnica           |
| `tasks.md`        | **Em que ordem**: tarefas pequenas (cabem num ciclo de agente), cada uma com REQs, o teste a escrever primeiro, os arquivos e o critério de pronto                                                                                                                         | Gerado do design          |

## Ciclo de vida

`draft` → `approved` → `in-progress` → `done` (campo `status` no topo de cada arquivo).

### Pronto para começar (Definition of Ready)

- Endpoint existe na API **ou** o contrato foi acordado com o backend e está marcado `contract: agreed` (nunca inventado pelo front).
- A tela existe no canvas (board indicado em `requirements.md`) ou a spec declara que é tela sem design.
- `requirements.md` aprovado.

### Pronto para entregar (Definition of Done)

- Todo REQ tem teste com o ID no nome, passando.
- `npm run verify` verde; E2E da spec verde (simulado sempre; real quando a API existe).
- Todo componente novo tem TSDoc e story; os reutilizáveis estão no catálogo do vault.
- Os [critérios de aceite de design](../../PetHost%20obsidian/PetHost%20obsidian/design/00-criterios-de-aceite.md) foram conferidos na tela renderizada, no computador e no celular.
- Nenhum `TODO` sem tarefa correspondente.

## Como o agente executa uma tarefa

1. Ler o `requirements.md`, o `design.md` e a tarefa. Procurar no catálogo e no código o que dá para reaproveitar.
2. **Vermelho:** escrever o teste do critério e rodar para ver falhar pelo motivo certo.
3. **Verde:** a implementação mínima.
4. **Refatorar:** extrair, renomear, remover duplicação, com o teste verde.
5. **Documentar:** TSDoc, story e catálogo.
6. Rodar `npm run verify` e marcar a tarefa `[x]` com a data. Uma tarefa por commit: `feat(auth): REQ-AUTH-002 envia login com papel`.

## Quando a spec está errada

O agente **para e pergunta**, nunca "completa" a spec por conta própria. Mudança de requisito volta para `requirements.md` (com data) antes do código.
