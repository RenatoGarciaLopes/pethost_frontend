# Home fiel à prancha (spec 005, T7)

Pedido do Renato em 17/10/2026, depois de ver a home no navegador ao lado da prancha. A estrutura funcional da 040 está certa (busca leva a `/search`, sem pedir cantinhos à API), mas o visual ficou longe do que desenhamos. Aqui o alvo é a prancha, não a nossa leitura dela.

## Referências (abrir as duas antes de começar)

- `C:/Users/Renato Lopes/Desktop/PetHost/PetHost obsidian/PetHost obsidian/assets/pranchas/quintal-visitante.png` (hero, busca e faixa de confiança)
- `.../assets/pranchas/quintal-casas.png` (página inteira, com a lista de casas logo abaixo)
- Notas: `design/10-hero.md`, `design/11-busca-e-cards.md`, `design/16-desktop-e-mobile.md`, `design/05-organico.md`, `design/06-movimento.md`.

## O que está diferente (tela de hoje × prancha)

| Parte | Prancha | Hoje | Correção |
|---|---|---|---|
| Cabeçalho | Largura total, linha de tinta de 2 px embaixo, logo alinhado ao contêiner de 1280, links "Como funciona", "Minhas estadias" e a pílula da conta com avatar e nome | Só "Minha conta" solto, sem linha, logo desalinhado do título | Usar o cabeçalho da casca com os links do papel (visitante: "Como funciona" e Entrar; tutor: "Minhas estadias" e a conta). "Conversas" só quando a 055 existir. |
| Fundo do hero | Céu em degradê de borda a borda, que termina num **gramado verde** com topo ondulado, tufinhos, margaridas, pólen e sementinhas | Degradê chapado e um corte reto no fim | Gramado de ponta a ponta com o topo ondulado e a busca **apoiada nele** |
| Cena | Casa grande à direita (telhado gema com hachuras, janela com floreira, porta em arco), sol de traços, nuvens, cerca de ripas, **a turma andando na cerca** | Só a porta, pequena, sem casa, sem cerca e sem a turma | Cena completa do `DoorScene` com casa, cerca, sol, nuvens e `TurmaWalker` entrando |
| Título | 3 linhas, `clamp(44px, 5vw, 68px)`, `max-width 15ch`, apoio de 19 px em 2 linhas | 4 linhas, o texto de apoio com 1 linha só e quebra feia ("própria / casa.") | Respeitar o `max-width` e a copy de duas frases ("Vizinhos de Maringá que recebem cães e gatos na própria casa. Você conversa antes, paga pelo app e recebe foto todo dia.") |
| Campo de reserva | **Uma faixa só**, branca, borda de tinta, raio 26, sombra dura de 5 px. Quatro células separadas por **traço tracejado**: ONDE · CHEGADA · SAÍDA · PET (rótulo pequeno em caixa alta e o valor embaixo, sem caixa de campo), ícone de patinha tracejado e o botão coral "Achar um cantinho" na ponta | Cartão gigante (raio de pílula grande), pergunta "Quantos pets viajam com você?" dentro, **inputs nativos `dd/mm/aaaa`** em caixas próprias, `select` nativo | Células sem caixa interna; data com o campo de data do sistema, mas com a **cara** da célula (valor legível "20 dez, a partir das 14h"); a pergunta de quantidade só aparece para o anfitrião, fora da faixa |
| Confiança | **Três caixas** (borda de tinta, raio 24, fundo creme) com **ícone ilustrado** (balão, câmera, cadeado) à esquerda, título em Caprasimo e uma linha de apoio: "Conversa antes de fechar / Pergunte tudo sobre a casa e a rotina.", "Foto do seu pet todo dia / As notícias chegam pelo chat.", "Pagamento guardado / O anfitrião só recebe depois que seu pet volta pra casa." | Três bullets com um check verde | `TrustList` vira três `Surface` com ícones desenhados no traço da marca (sem biblioteca de ícones genérica); uma coluna no celular |
| Ritmo da página | Hero, faixa de confiança, depois o título "N casas com vaga perto de..." com chips e cards | Termina na lista de bullets, o resto vazio | Ver "Abaixo da dobra" |

## Abaixo da dobra

A prancha mostra a lista de casas logo abaixo. A 041 (busca) já existe e o `/search` entrega isso. Proposta, para o tutor com endereço e pet cadastrado: seção "Casas com vaga perto de {bairro}" com os chips e 6 cards reaproveitando `ListingCard` e `searchQueries` (sem duplicar), e o link "Ver todas". Visitante e anfitrião não veem a seção. Se isso exigir mudar a regra "a home não pede cantinhos à API" da 040, parar e perguntar ao Claude Code antes.

## Interações (do `design/10-hero.md`, conferir cada uma)

- Mover o mouse: parallax em 3 camadas, flores se inclinam para longe do cursor.
- Mouse sobre a casa: a porta abre.
- A turma desfila e entra pela porta, um de cada vez, 4 s por travessia.
- Movimento reduzido: tudo parado, dois cães em posição fixa.
- Foco visível em todos os campos; a faixa de busca tem de ser navegável por teclado nas quatro células.

## Celular (390 px)

- Cena menor sob o título, gramado mantido; a busca recolhe numa pílula "Onde, datas e pet" que abre a faixa em coluna (já existe `aria-expanded`/`aria-controls`).
- Caixas de confiança empilhadas, 56 px de alvo mínimo, sem scroll horizontal.

## Aceite (tudo precisa estar verdadeiro para entregar)

1. Lado a lado com a prancha, em 1440 e 390, um humano não aponta diferença estrutural: cabeçalho, hero com casa e cerca, faixa de busca única, três caixas com ícone.
2. Raios só por `quintalRadii` (a regra `pethost/no-numeric-radius` já bloqueia o resto).
3. Largura `page` (1200) no conteúdo e no cabeçalho; nada solto à esquerda.
4. Testes: os da 040 continuam valendo (ajustar o que mudou de estrutura, sem apagar cobertura); E2E da home e axe das stories verdes.
5. Anexar os dois prints (1440 e 390) em `test-results/` e comparar com a prancha na mensagem de entrega, apontando o que ainda difere e por quê.
6. Nada de código morto: o que sair da home sai do repositório.
