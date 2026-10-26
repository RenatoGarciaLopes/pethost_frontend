# Design — 109

- `HeaderNav.tsx` concentra a mudança. `roundButtonSx` (48 px, contorno de tinta, pílula) serve ao botão do menu e ao X; `StrokeIcon` desenha os traços (2,4 px, pontas arredondadas, como `feedbackIcons`). `AccountMenu` ganhou `minWidth: 48` para o avatar ficar redondo como o botão.
- `links(drawer)` gera os atalhos do computador e da gaveta; só muda a geometria (56 px, largura total, grama na página atual) e o `onClick` que fecha.
- Foco: `autoFocus` no X (primeiro item da gaveta); o MUI Modal devolve o foco ao botão. O paper mantém `aria-label` de navegação (regra axe `aria-dialog-name`).
- Movimento: `transitionDuration` usa `SPRING_ASSENTAR` (340 ms) na entrada e 200 ms na saída; com `usePrefersReducedMotion` vira 0.
- **Conta na gaveta: não.** Trocar/sair exigiria passar o usuário ao `HeaderNav` e reusar `useLogout`/`useLinkedAccounts` num segundo lugar. O avatar ao lado, a um toque, continua sendo o único dono dessa lógica.
- **Ícones por atalho: não.** O projeto não tem conjunto de ícones de navegação e a brief proíbe inventar uma biblioteca.
- Sem divisória tracejada: a gaveta tem um só grupo de links.
- Regra de design registrada em `design/16-desktop-e-mobile.md`: o menu abre do lado do botão.
