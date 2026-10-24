# 070 · Card de cantinho fiel à prancha

Prancha: `assets/pranchas/quintal-casas.png` (seção "casas com vaga perto da Zona 7"). Só frontend: nada muda na API. Detalhes em `design.md`.

## Requisitos

- **REQ-SRCH-007** O card é um link único. A foto é a moldura (contorno de tinta 2 px, raio do card, sombra dura) e o texto fica fora, embaixo. Foto sem URL mostra "Cantinho sem foto".
- **REQ-SRCH-021** Chip do anfitrião no canto inferior esquerdo da foto (foto de perfil ou iniciais em cor estável); selo "Vizinho" no canto superior direito, só quando a API devolve `neighbor`; nota "★ 4,8 (9)" só com `rating`; bairro e "N km de você" (ou a cidade, sem distância); atributos com ícone só do que o resumo tem (`homeType`, `hasYard`, selos `fast_responder`, `experienced`, `well_rated`).
- **REQ-SRCH-020** Com pet escolhido (tutor logado), cada card mostra o chip de compatibilidade vindo de `GET /listings/{id}/compatibility`: verde "✓ Combina com a {pet}" ou tracejado "! {aviso}" (primeiro aviso, com "+N" se houver mais). Visitante e carregamento ou falha não mostram chip nem consultam.
- **REQ-SRCH-022** Preço: "R$ 275 as 5 noites · R$ 55/noite" com período e pets; sem isso, só "R$ 55/noite".
- **REQ-NEARBY-021** A vitrine da home repassa pets escolhidos e datas da busca ao card; mantém a reserva `useAllListings` (REQ-NEARBY-016 a 019).

## Fora do escopo (lacunas da API)

"O Bóris mora aqui", "Varanda", "Sofá liberado", "Crianças" e o selo "Novo por aqui" não existem no resumo da API. Registrados em `tasks/todo.md` do vault.
