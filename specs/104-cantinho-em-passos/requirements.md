# 104 — Abrir meu cantinho em passos

Status: implemented; validação em validation.md.

Pedido do Renato (25/10/2026): o cadastro do cantinho deixa de ser sete seções empilhadas com "Salvar" cada e vira um
multistep no padrão do cadastro de conta, na estética Quintal, com foco em UI/UX. Decisão:
`PetHost obsidian/PetHost obsidian/decisoes/2026-10-25-cantinho-em-passos.md`. Substitui a regra 12 da nota 17 e a
"Etapa 3 · painel de seções" da nota 19 **só para o cadastro novo** (`/host/listings/new`).

## Requisitos

- **REQ-104-01 Casca compartilhada.** O cadastro usa `StepWizard`/`StepWizardActions`/`WizardProgress`, os mesmos do
  cadastro de conta (074) e da verificação (098). Sem casca paralela; a variação nova (coluna ao vivo) estende o
  compartilhado sem mudar o visual dos outros dois fluxos.
- **REQ-104-02 Uma ideia por tela.** Nove passos, de 1 a 5 perguntas cada (o endereço é o grupo do CEP, como no
  cadastro de conta): Sua casa · Nome e descrição · Quem mora com você · Quem você recebe · Endereço · Regras da casa ·
  Dias que recebe · Diária por pet · Confere e abre.
- **REQ-104-03 Navegação.** O botão de avançar diz o que vem ("Continuar: endereço"); "Voltar" nunca apaga nada; no
  primeiro passo, "Voltar" leva ao painel com o rascunho guardado.
- **REQ-104-04 Validação.** Cada campo ao sair dele e o passo inteiro no "Continuar", pelos schemas das seções
  (`createListingSchemas`); o "Continuar" não avança com erro e leva o foco ao primeiro campo com erro. Campo que já
  mostra erro é conferido de novo quando muda (cartões e Sim/Não não têm "sair do campo").
- **REQ-104-05 Computador.** Trilha à esquerda, passo no meio e, a partir de `lg`, o card do cantinho se montando ao
  vivo à direita, com a cara do card da busca (título, bairro e cidade, casa e quintal, quem recebe, diária). Nunca o
  endereço exato no card.
- **REQ-104-06 Celular (390).** Anel "n/9", nome do passo e "Próximo: …"; barra de ações fixa (Voltar em texto,
  Continuar coral) com a área segura; sem rolagem horizontal; botões de 56 px. Na revisão, o card aparece antes dos
  blocos.
- **REQ-104-07 Controles Quintal (tabela da nota 17).** Casa/Apartamento em `ChoiceCard` grande com desenho; Sim/Não em
  `SegmentedControl` largo; espécies e portes em cartões de marcar (`CheckCardGroup`), portes só com cachorro ou gato;
  capacidade no `Counter` com "Somando todos os tutores"; dias no `WeekdayPicker` com "Todos os dias" no controle;
  regras com chips de atalho; diária em número grande e a simulação líquida (90%) em destaque.
- **REQ-104-08 Rascunho.** Continua na sessão do navegador e guarda também o passo. Ao voltar, abre no passo salvo com
  "Continuando de onde você parou." e "Começar de novo". O formato antigo (`{ values, done }`) não quebra: abre no
  primeiro passo que falta.
- **REQ-104-09 Confere e abre.** A ficha inteira em blocos com "Editar" em cada um (leva ao passo; o botão do passo vira
  "Voltar pra revisão"); "Abrir meu cantinho" coral e grande; envio único; depois, `ListingOpened` como antes.
- **REQ-104-10 Erros da API.** Erro de campo volta ao passo certo com foco no campo (o mecanismo
  `applyFieldErrors` + `showFieldsWithError` do cadastro); `LISTING_ADDRESS_NOT_LOCATED` volta ao endereço com o aviso;
  `LISTING_GEOCODER_UNAVAILABLE` e o resto avisam na revisão, com o aviso recebendo o foco; o rascunho fica.
- **REQ-104-11 Edição.** `/host/listings/{id}` continua em seções; só recebe os controles novos por compartilhar os
  campos.
- **REQ-104-12 A11y.** Título do passo recebe o foco ao trocar; aviso de erro anunciado; grupos com legenda (`fieldset`);
  contraste AA; sem animação com `prefers-reduced-motion`.

## Fora do escopo

- Contrato e comportamento da API (é composição e navegação: um `POST` só no fim).
- Fotos no cadastro (continuam depois de abrir, em `ListingOpened` → edição).
- Execução do E2E (vai para o CI); só os seletores foram ajustados.
