---
spec: 002-design-system
status: draft
updated: 2026-10-11
area: DS
---

# 002 · Design system Quintal

## Contexto

Todas as telas do canvas usam a mesma base:

- **tinta, papel e coral;**
- **forma:** contorno de 2 px, sombra dura, raio grande;
- **letra:** Caprasimo nos títulos e Atkinson Hyperlegible Next no texto;
- **movimento:** duas molas;
- **peças repetidas:** cartão de escolha, segmentado, trilha de passos, aviso e dica.

Sem um tema único, cada agente recriaria essas peças com pequenas diferenças. Esta spec transforma o Quintal em tema MUI e nos primitivos de `shared/ui`, e cada primitivo nasce com story ligada ao board de origem.

## Referências

- **Vault:**
  - `marca/07-cor.md` (papel `#FEFAF3` desde 11/10), `marca/08-tipografia.md`, `marca/10-ilustracao-e-textura.md`, `marca/04-logo.md`;
  - `design/06-movimento.md`, `design/08-acessibilidade.md`, `design/09-componentes-mui.md`, `design/17-cadastros-e-formularios.md`, `design/00-criterios-de-aceite.md`.
- **Canvas:** os componentes dos boards `Fluxo-Conta`, `Fluxo-Pet`, `Fluxo-Verificacao` e `Busca-Mapa`.
- **Depende de:** 001.

## Critérios de aceite

| ID         | Critério                                                                                                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-DS-001 | O SISTEMA DEVE expor os tokens como CSS variables do MUI (`cssVariables: true`): `papel #FEFAF3`, `tinta #1F1A17`, `texto2 #5A4E45`, `coral #F26B3A`, `gema #FFC93C`, `grama #C5DB4F`, `ceu #7FC4E0`, `luz #FFE9B0`, `cartao #FFF6E6`, `linha #E3D6C2`, `erro #A8323E`, `foco #2F5A86` |
| REQ-DS-002 | O botão principal (coral) DEVE usar texto tinta (contraste ≥ 4,5:1); texto branco sobre coral é proibido                                                                                                                                                                               |
| REQ-DS-003 | O SISTEMA DEVE carregar Caprasimo e Atkinson Hyperlegible Next como fontes locais (`next/font/local`), sem requisição ao Google Fonts; `h1` a `h4` em Caprasimo, o resto em Atkinson; texto base de 17 px                                                                              |
| REQ-DS-004 | Botões, campos, cartões e chips DEVEM ter contorno tinta de 2 px e sombra dura deslocada (3, 5 ou 8 px, sem desfoque) no lugar das 25 elevações do Material                                                                                                                            |
| REQ-DS-005 | QUANDO um botão é pressionado, ELE DEVE afundar (`translate(3px,3px)` e sombra 0) com a mola "assentar" (340 ms); o hover sobe 1 px                                                                                                                                                    |
| REQ-DS-006 | Todo elemento focável DEVE mostrar um anel de foco `#2F5A86` de 3 px com deslocamento visível                                                                                                                                                                                          |
| REQ-DS-007 | Botões e alvos de toque DEVEM ter altura mínima de 48 px (botão principal: 56 px)                                                                                                                                                                                                      |
| REQ-DS-008 | ENQUANTO o usuário preferir movimento reduzido, O SISTEMA DEVE desligar loops e trocar molas por um fade de 150 ms ou nenhuma transição (`usePrefersReducedMotion` + CSS)                                                                                                              |
| REQ-DS-009 | `ChoiceCardGroup` DEVE ser um `radiogroup` navegável por setas; a opção marcada fica grama, com check e afundada                                                                                                                                                                       |
| REQ-DS-010 | `SegmentedControl` DEVE ser um `radiogroup`, com a opção ativa em grama, ocupando a largura toda quando `fullWidth`                                                                                                                                                                    |
| REQ-DS-011 | `PasswordField` DEVE ter o botão "Mostrar"/"Esconder" com `aria-pressed` e manter o foco no campo                                                                                                                                                                                      |
| REQ-DS-012 | `WizardProgress` DEVE mostrar a trilha vertical (feito, atual, falta) no computador e o anel "n/total" + "Próximo: …" no celular, com o passo atual anunciado (`aria-current="step"`)                                                                                                  |
| REQ-DS-013 | `Notice` DEVE ter os tons `info`, `ok`, `atencao` e `erro`, sempre com ícone além da cor; `erro` usa `role="alert"` e os demais `role="status"`                                                                                                                                        |
| REQ-DS-014 | `Hint` (dica tracejada), `StatusPill`, `Sticker`, `EmptyState`, `FormActions` (fixo no rodapé no celular) e `LockedField` DEVEM existir conforme os boards                                                                                                                             |
| REQ-DS-015 | `DoorMark` DEVE seguir a especificação do logo (folha e batente com a mesma espessura, luz creme, traço por tamanho); `DoorScene` DEVE abrir a porta quando o formulário irmão recebe hover ou foco, e ser `aria-hidden`                                                               |
| REQ-DS-016 | `TurmaWalker` e `Celebration` DEVEM tocar uma vez (ou em loop lento quando indicado), nunca bloquear a interação e respeitar o REQ-DS-008                                                                                                                                              |
| REQ-DS-017 | O SISTEMA DEVE gerar a Appearance do Stripe a partir dos mesmos tokens (`toStripeAppearance(theme)`), para uso futuro (spec 043)                                                                                                                                                       |
| REQ-DS-018 | Cada primitivo DEVE ter story com os estados do board de origem (`parameters.design` aponta o board) e passar no addon de acessibilidade sem violações                                                                                                                                 |

## Fora do escopo

- **Componentes de domínio:** `PetIdCard` e os da verificação ficam nas features.
- **Mapa.**
- **Calendário.**
