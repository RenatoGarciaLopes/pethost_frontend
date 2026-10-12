---
spec: NNN-slug
status: draft
updated: AAAA-MM-DD
area: AREA # prefixo dos REQs, ex.: AUTH, PET, HAPP
---

# NNN · Nome da tela ou capacidade

## Contexto

Para quem é, qual medo ou tarefa resolve (link para `produto/personas.md`), onde entra na jornada.

## Referências

- **Design:** canvas "PetHost · Resultados de cantinhos" → board `Fluxo-…` → tela "…" (computador e celular). Regras de design aplicáveis (links do vault).
- **API:** `MÉTODO /api/v1/…` (status: implemented | agreed | planned), campos e erros relevantes (link para `produto/contrato-api.md` e `pethost_backend/docs/modulo-*.md`).
- **Specs de que depende:** …

## Histórias

- Como <papel>, quero <ação> para <resultado>.

## Critérios de aceite

Formato EARS. Um comportamento observável por ID.

| ID           | Critério                     |
| ------------ | ---------------------------- |
| REQ-AREA-001 | QUANDO …, O SISTEMA DEVE …   |
| REQ-AREA-002 | ENQUANTO …, O SISTEMA DEVE … |
| REQ-AREA-003 | SE … ENTÃO O SISTEMA DEVE …  |

## Estados da tela

| Estado     | O que aparece |
| ---------- | ------------- |
| Carregando | …             |
| Vazio      | …             |
| Erro       | …             |
| Sucesso    | …             |

## Microcopy

Textos exatos, incluindo erros da API traduzidos.

## Acessibilidade e responsividade

Itens específicos desta tela, além do padrão de `docs/conventions.md`.

## Fora do escopo

O que não entra, para o agente não inventar.
