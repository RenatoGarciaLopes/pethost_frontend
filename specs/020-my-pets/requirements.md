---
spec: 020-my-pets
status: in-progress
updated: 2026-10-13
area: PETS
---

# 020 · Meus pets

## Contexto

O tutor abre "Meus pets" para ver quem já foi apresentado ao PetHost e apresentar outro. É o ponto de partida de tudo que envolve pet: ficha (022), cadastro (021) e, depois, a escolha de quem vai na estadia (050). A lista mostra a **carteirinha** de cada pet, o documento da casa ([[18-cadastro-do-pet]]), e não uma tabela.

A mesma tela atende o anfitrião aprovado ("Pets da casa"); as diferenças de texto e a regra de aprovação estão na spec 023.

## Referências

- **Design:** canvas "PetHost · Resultados de cantinhos" → board `Fluxo-Pet` → "Meus pets" (computador 1440 e celular 390). Vault: `design/18-cadastro-do-pet.md` (seções "A carteirinha", "Meus pets", "Estados", "Tirar um pet da lista"), `design/15-estados-com-e-sem-pet.md`, `design/02-orcamento-de-personalidade.md` (intensidade zero).
- **API:**
  - ✅ `GET /api/v1/pets/me` → `{ keeper: { id, type, name, avatarUrl? }, pets: Pet[] }`; ativos e inativos, do mais novo para o mais antigo, sem paginação; cada pet sem `ownerId`, `hostId` e `keeper` (`pethost_backend/docs/modulo-pets.md` seção 3.1).
  - Erros: `401 UNAUTHORIZED` (BFF trata), `403 FORBIDDEN` (admin), `404 PET_KEEPER_NOT_FOUND` (conta sem perfil; só acontece com anfitrião não aprovado, ver 023).
- **Depende de:** 002 (`EmptyState`, `Sticker`, `StatusPill`, `ErrorState`, `SniffLoader`), 003 (`bffClient`, `createBackendClient`, `accountQueryKey`, `getErrorMessage`, `requireSession`), 004 (`requireRole`, `NAV_ITEMS`, casca).

## Histórias

- Como tutor, quero ver as carteirinhas dos meus pets para abrir a ficha de um deles.
- Como tutor sem pet, quero entender em uma frase por que apresentar o pet e começar com um toque.
- Como tutor de um pet que saiu da lista, quero que ele não ocupe a lista principal, mas que a ficha continue acessível.

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-PETS-001 | O SISTEMA DEVE listar os pets ativos de `GET /pets/me` como carteirinhas compactas (foto de capa redonda ou silhueta da espécie, nome, espécie, porte quando houver), na ordem da API                                                                        |
| REQ-PETS-002 | Cada carteirinha DEVE ser um link único para `/pets/{petId}` com nome acessível "Ficha de {nome}"; não pode haver controles aninhados dentro do link                                                                                                         |
| REQ-PETS-003 | O SISTEMA DEVE mostrar, depois dos pets, o tile "Apresentar outro pet" (patinha no círculo tracejado) que leva a `/pets/new`                                                                                                                                 |
| REQ-PETS-004 | QUANDO não houver pet ativo nem inativo, O SISTEMA DEVE mostrar o estado vazio "Apresenta seu pet pra gente? Leva uns 3 minutos." com o botão "Apresentar meu pet" e o link secundário "Buscar um cantinho mesmo assim" (só quando a 041 estiver disponível) |
| REQ-PETS-005 | QUANDO houver pets inativos, O SISTEMA DEVE agrupá-los em "Fora da lista" (recolhido por padrão, com a contagem), em tom neutro: sem alerta, sem turma, sem perguntar motivo                                                                                 |
| REQ-PETS-006 | O SISTEMA DEVE renderizar a lista no servidor com os dados já carregados (prefetch + hidratação), sem tela de carregando no primeiro acesso                                                                                                                  |
| REQ-PETS-007 | QUANDO um pet for criado, editado, desativado, reativado ou tiver fotos alteradas (021 e 022), a lista DEVE refletir a mudança na próxima visita sem recarregar a página (invalidação da query)                                                              |
| REQ-PETS-008 | SE a API falhar, O SISTEMA DEVE mostrar o `ErrorState` com a frase de `getErrorMessage` e "Tentar de novo"; a casca continua navegável                                                                                                                       |
| REQ-PETS-009 | QUANDO houver um rascunho de cadastro desta conta (021), O SISTEMA DEVE mostrar a faixa "A ficha de {nome} ficou pela metade. Continuar?" com "Continuar" e "Descartar"                                                                                      |
| REQ-PETS-010 | A rota `/pets` DEVE exigir conta de tutor ou anfitrião (`requireRole(["owner", "host"])`); admin vai para a casa dele                                                                                                                                        |
| REQ-PETS-011 | A linha de resumo da carteirinha DEVE ser montada por uma função pura única (`describePet`), reutilizada na ficha (022), na revisão (021) e na escolha de pets da estadia (050)                                                                              |

## Estados da tela

| Estado                            | O que aparece                                                               |
| --------------------------------- | --------------------------------------------------------------------------- |
| Carregando (navegação no cliente) | Grade de 3 carteirinhas-esqueleto com o mesmo tamanho das reais             |
| Vazio                             | `EmptyState` com patinha tracejada, frase e botão (REQ-PETS-004)            |
| Com pets                          | Grade (3 colunas no computador, 1 no celular) + tile "Apresentar outro pet" |
| Com inativos                      | Seção recolhida "Fora da lista (N)" abaixo da grade                         |
| Rascunho                          | Faixa acima da grade (REQ-PETS-009)                                         |
| Erro                              | `ErrorState` + "Tentar de novo"                                             |
| Pet em estadia agora              | Fora do escopo até a 054 (selo céu "Na casa de {anfitrião}")                |

## Microcopy

| Lugar            | Texto                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Título da página | "Meus pets"                                                                                                              |
| Tile             | "Apresentar outro pet"                                                                                                   |
| Vazio            | "Apresenta seu pet pra gente? Leva uns 3 minutos." · botão "Apresentar meu pet"                                          |
| Inativos         | "Fora da lista (N)" · ajuda "As fichas continuam aqui. As estadias antigas também."                                      |
| Rascunho         | "A ficha de {nome} ficou pela metade. Continuar?" · "Continuar" · "Descartar" (sem nome: "Uma ficha ficou pela metade.") |
| Resumo (exemplo) | "Vira-lata · porte médio · 4 anos · fêmea · castrada"                                                                    |

## Acessibilidade e responsividade

- Grade como lista (`ul`/`li`); cada carteirinha é um `a` com nome acessível próprio; a foto tem `alt=""` (o nome já está no texto).
- A seção "Fora da lista" usa botão com `aria-expanded` e `aria-controls`.
- Celular: uma coluna, tile "Apresentar outro pet" no topo da lista (alcance do polegar), carteirinha inteira clicável com alvo de pelo menos 44 px.

## Fora do escopo

- Escolher pets para uma estadia (050), selo "em estadia" (054).
- Ordenar ou filtrar (a API não pagina nem filtra).
- Pets da casa do anfitrião: textos e regra de aprovação na 023.

## Perguntas em aberto

- **Idade no resumo:** `birthDate` é aproximada. Mostrar "4 anos" arredondado para baixo, "8 meses" abaixo de 1 ano, e nada sem data. Confirmar com o produto.
- **Sexo no resumo:** "macho", "fêmea"; `unknown` não aparece no resumo.
