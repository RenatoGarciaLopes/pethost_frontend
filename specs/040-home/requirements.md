---
spec: 040-home
status: in-progress
updated: 2026-10-15
area: HOME
---

# 040 · Início

## Contexto

`/` é a entrada pública da PetHost e hoje responde 404. A tela apresenta o cuidado em casas de vizinhos e permite preparar uma busca antes de entrar. A pesquisa de disponibilidade exige sessão e pertence à spec 041. A pessoa visitante, o tutor sem pet cadastrado e o tutor com pet têm estados próprios; cadastrar um pet nunca é pré-requisito para começar uma busca.

## Referências

- **Design:** boards `Quintal-Visitante` e `Quintal-Casas`, notas do vault `design/10-hero.md`, `15-estados-com-e-sem-pet.md`, `16-desktop-e-mobile.md`, `14-loading.md` e `21-mapa-de-telas.md`.
- **Roadmap:** linha 040 em `specs/roadmap.md`: hero com a turma e o campo “Cão ou gato?”; conteúdo estático pode ser entregue antes da API de busca.
- **Sessão e pets:** `GET /users/me` e `GET /pets/me` implementados nas specs 003/020. `/pets/me` só é consultado para tutor autenticado; anfitrião e visitante não fazem essa chamada.
- **Busca (spec 041):** `GET /listings` exige login. A home não chama a busca. Monta `/search` com `where`, `from`, `to` e seleção de pet/espécie; sem sessão envolve o destino em `/login?next=` preservando todos os parâmetros.
- **Depende de:** 002, 003, 004 e 020. Entrega o destino da busca consumido pela 041; não implementa resultados nem API de listings.

## Histórias

- Como visitante, quero entender como funciona o cuidado e preparar uma busca sem criar um perfil de pet antes.
- Como tutor sem pet cadastrado, quero buscar por cão ou gato sem interromper a procura para cadastrar um pet.
- Como tutor com pets cadastrados, quero escolher os pets da viagem e ver a home falar deles pelo nome.
- Como anfitrião, quero abrir a busca informando quantos pets viajam.

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-HOME-001 | QUANDO uma pessoa abre `/`, autenticada ou não, O SISTEMA DEVE renderizar a página pública de Início em vez de 404; a metadata identifica “Início · PetHost”.                                                                                                                                                               |
| REQ-HOME-002 | ENQUANTO visitante ou tutor não tiver pet ativo, O SISTEMA DEVE mostrar “Um quintal pro seu pet enquanto você viaja”, explicar que vizinhos recebem cães e gatos e permitir selecionar cão ou gato sem pedir cadastro.                                                                                                     |
| REQ-HOME-003 | SE um tutor tiver pets ativos, O SISTEMA DEVE iniciar com o pet mais recente selecionado, usar o nome dele sem inferir gênero, permitir escolher um ou mais pets e atualizar a chamada conforme a seleção. Pets inativos não aparecem.                                                                                      |
| REQ-HOME-004 | QUANDO anfitrião abrir a busca, O SISTEMA DEVE oferecer quantidade de pets; a home não deve buscar nem carregar pets da casa.                                                                                                                                                                                               |
| REQ-HOME-005 | QUANDO uma pessoa enviar a busca, O SISTEMA DEVE levar para `/search`, preservando `where`, `from`, `to` e os parâmetros de pets/espécie/quantidade aplicáveis. Com sessão, navega direto; sem sessão, navega a `/login?next=` cujo valor decodificado é o destino completo de `/search`. A home não chama `GET /listings`. |
| REQ-HOME-006 | ENQUANTO o formulário estiver expandido, O SISTEMA DEVE mostrar rótulos visíveis “Onde”, “Chegada”, “Saída” e “Pet” e alvos de interação acessíveis; no celular o formulário começa recolhido como pílula e se expande ao toque.                                                                                            |
| REQ-HOME-007 | O hero DEVE manter a composição aprovada: texto à esquerda e cena do quintal com a turma à direita no computador; no celular, conteúdo em coluna, sem depender de hover. A travessia é calma e `prefers-reduced-motion` mantém a cena compreensível e parada.                                                               |
| REQ-HOME-008 | A home DEVE mostrar, perto da busca, as três garantias de confiança existentes no produto, usando `TrustList`.                                                                                                                                                                                                              |
| REQ-HOME-009 | SE a consulta opcional de pets falhar, O SISTEMA DEVE mostrar texto curto de indisponibilidade, manter o campo “Cão ou gato?” e permitir continuar para a busca.                                                                                                                                                            |
| REQ-HOME-010 | ENQUANTO a sessão/personalização aguarda dados da requisição, O SISTEMA DEVE mostrar uma alternativa visual de carregamento que não anuncia dados pessoais nem oferece uma ação com destino incorreto.                                                                                                                      |

## Estados da tela

| Estado                 | O que aparece                                                         |
| ---------------------- | --------------------------------------------------------------------- |
| Visitante              | Hero genérico; escolha Cão ou gato?; busca continua depois do login.  |
| Tutor sem pet          | Hero genérico; escolha Cão ou gato?; busca vai direto para `/search`. |
| Tutor com pets         | Nome do pet selecionado no hero; multisseleção dos pets ativos.       |
| Anfitrião              | Hero genérico; quantidade de pets; busca vai direto para `/search`.   |
| Falha ao carregar pets | Aviso breve, seleção de espécie como alternativa e busca disponível.  |
| Carregando             | Fallback sem controles de busca interativos.                          |

## Microcopy

- “Um quintal pro seu pet enquanto você viaja”
- “Um quintal pra {nome} enquanto você viaja”
- “Um quintal pros seus pets enquanto você viaja”
- “Vizinhos de Maringá que recebem cães e gatos na própria casa.”
- “Onde” · “Perto de casa ou cidade” · “Chegada” · “Saída” · “Pet” · “Cão ou gato?” · “Achar um cantinho”
- Tutor com pet: “Escolha quem vai viajar com você.”
- Tutor sem pet: “Você pode buscar antes de cadastrar seu pet.”
- Visitante: “Entre para ver os cantinhos disponíveis.”
- Falha de pets: “Não conseguimos carregar seus pets agora. Você pode buscar por cão ou gato.”
- Garantias: “Converse antes de combinar” · “Receba foto todo dia” · “Pagamento protegido até seu pet voltar”

## Acessibilidade e responsividade

- Um `h1` descritivo; campos com rótulos visíveis associados; multisseleção de pets com nome e espécie; botões com foco visível.
- A pílula de busca do celular informa `aria-expanded` e controla os campos; não existe dependência de hover.
- A cena e os cães são decorativos para leitor de tela. Movimento respeita `prefers-reduced-motion`.
- O computador usa colunas com cena ilustrada; celular usa uma coluna e gutter de 16 px.
- Textura é asset raster existente; o conteúdo continua legível sem ela.

## Fora do escopo

- Resultados, filtros, mapa, disponibilidade e chamada a `GET /listings` (spec 041).
- Cadastro/edição de pets, estados da conta e dados de hospedagens reais.
- Uso de URL assinada ou dados privados de pet na query. Os ids selecionados são os parâmetros de seleção previstos pela 041; fotos não são transferidas à home.
- Reescrever o destino pós-login ou pós-troca de conta: o tutor já retorna a `/` por `appRoutes`.
