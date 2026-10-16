---
spec: 005-ui-conformance
status: approved
updated: 2026-10-15
area: UIC
---

# 005 · Conformidade visual (Quintal)

## Contexto

Em 15/10 o Renato apontou que as telas estão fugindo dos critérios de UI/UX (prints de `/host` e `/host/application/new`):

- **Cabeçalho inconsistente:** a altura e o tamanho do logo mudam entre as telas, e o atalho da seção atual nem sempre aparece marcado.
- **Indicador de passos diferente:** a verificação usa uma trilha vertical própria, empilhada em cima do conteúdo; o cadastro do pet usa outra.
- **Raios exagerados:** os cartões parecem pílulas.
- **Espaço mal usado:** no computador, a coluna é estreita e sobra vazio dos lados.

A causa técnica do raio já está achada: o tema usa `shape.borderRadius: 18` e, no `sx` do MUI, `borderRadius: 3` multiplica a base (vira 54 px). Os tokens `quintalRadii` (campo 18, cartão 24, pílula 999) existem e não são usados. As larguras também variam sem regra (`xs`, `sm`, `md` e `lg` em telas do mesmo tipo).

Esta spec define regras únicas e verificáveis e as aplica em todas as telas existentes.

## Referências

- Vault `design/`: `00-criterios-de-aceite.md` (seções 4, 7, 7b e 8), `09-componentes-mui.md` (forma, sombra, componentes), `17-cadastros-e-formularios.md` (progresso, três faixas no computador, barra fixa no celular), `16-desktop-e-mobile.md`, `21-mapa-de-telas.md` (cor do cabeçalho por conta).
- Código: `src/shared/theme` (tokens, overrides), `src/widgets/app-shell`, `src/shared/ui/navigation/WizardProgress`, `src/shared/ui/data-display/StatusTimeline`, `src/widgets/host-onboarding`.

## Critérios de aceite

| ID | Critério |
| --- | --- |
| REQ-UIC-001 | Todo raio de canto DEVE vir dos tokens: campo 18, cartão e superfície 24, pílula 999, mais `media` 16 para miniaturas e `control` 12 para elementos pequenos. Nenhum `borderRadius` numérico solto no `sx`; uma regra de lint barra isso |
| REQ-UIC-002 | Superfícies (cartão, painel, seção) DEVEM usar um componente único (`Surface`): fundo branco, borda tinta de 2 px, raio de cartão, sombra dura (3, 5 ou 8 px) e, quando clicável, hover sobe 1 px e o pressionado afunda. Nenhum cartão monta a própria borda e sombra |
| REQ-UIC-003 | O cabeçalho DEVE ter a mesma altura (64 px no computador e 56 no celular), o mesmo logo (porta e nome) e a mesma posição em todas as áreas logadas, com a cor por conta (tutor papel, anfitrião gramado claro, admin areia). O atalho da área atual fica marcado também nas sub-rotas (prefixo), e o anfitrião tem "Painel" (`/host`) como primeiro atalho |
| REQ-UIC-004 | As páginas DEVEM usar só três larguras de conteúdo: `page` (1200 px; painéis, listas, busca), `flow` (cadastros em três faixas, ver 005) e `reading` (720 px; textos e confirmações). Gutter de 16 px no celular e 32 px no computador |
| REQ-UIC-005 | Todo cadastro em passos (criar conta, apresentar o pet, verificação, abrir o cantinho, pedir estadia) DEVE usar o mesmo `FlowLayout`. No computador: trilha vertical à esquerda (240 px, nome e uma linha de descrição por passo; feito com check grama, atual em destaque, o que falta em contorno), o passo no meio e, quando houver, a ficha ou o cartão ao vivo à direita (360 px). No celular: uma coluna, o anel "2/5" com o nome do passo e "Próximo: …" no topo, e a barra de ações fixa embaixo (Voltar em texto e Continuar coral), respeitando a área segura |
| REQ-UIC-006 | O progresso dos cadastros DEVE ser um componente só (`FlowProgress`), com o texto "Passo 2 de 5 · Corpo" para leitor de tela, sem quique. O `StatusTimeline` fica só para a trilha de status (estadia, verificação já enviada) |
| REQ-UIC-007 | Painéis e listas DEVEM ocupar a largura `page` com grade responsiva (1 coluna no celular, 2 ou 3 no computador) e cabeçalho de página padronizado (`PageHeader`: título h1 em Caprasimo, subtítulo opcional, ações à direita no computador e embaixo no celular) |
| REQ-UIC-008 | Botões DEVEM ter 48 a 60 px (contained 56); campos com rótulo visível acima e 56 px; o estado travado ("Travada") é um `StatusPill` neutro com o que falta escrito, nunca um botão desabilitado sem explicação |
| REQ-UIC-009 | Toda tela DEVE ter versão de computador que usa o espaço com intenção (não o celular esticado) e versão de celular com gutter de 16 px, conferidas em 1440 e 390 px |
| REQ-UIC-010 | Uma galeria de telas (Playwright, fora do CI) DEVE capturar todas as rotas existentes em 1440 e 390 px, com as contas de tutor, anfitrião e admin do mock, para a revisão visual antes de cada entrega |

## Fora do escopo

Redesenho de telas (layout novo de uma tela específica além das regras acima), ilustrações novas, hero da home.
