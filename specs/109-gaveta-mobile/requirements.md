# 109 — Menu do celular (botão e gaveta)

- REQ-SHELL-006: abaixo de 900 px o menu abre **do lado do botão**: botão à direita, gaveta deslizando da direita (`anchor="right"`). Vale para tutor, anfitrião, admin e o `OwnerHeaderNav`.
- Botão: ícone SVG de três traços em tinta, alvo de 48 px, contorno de tinta e o mesmo tamanho do avatar da conta (os dois formam um par), foco visível, `aria-expanded` e `aria-controls` (só com a gaveta aberta). O ponto de novidade das estadias continua.
- Gaveta no visual Quintal: fundo papel, borda de tinta de 2 px no lado de dentro, largura 85% da tela com máximo de 320 px, cabeçalho com DoorMark e X "Fechar menu" de 48 px alinhado ao botão que abriu, links de 56 px em negrito, página atual com contorno de tinta, fundo grama e `aria-current="page"`.
- Comportamento: fecha no link, no X, no fundo escuro e com Esc; foco no X ao abrir e de volta ao botão ao fechar; mola "assentar" na entrada, sem animação com `prefers-reduced-motion`.
- Fora do escopo (justificado em design.md): conta no rodapé da gaveta e ícones por atalho.
