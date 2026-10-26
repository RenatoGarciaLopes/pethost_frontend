# Design

Comparados no chip de seleção: [Fluent Emoji Flat](https://github.com/microsoft/fluentui-emoji/tree/main/assets), [MIT](https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE), e [Noto Emoji v2.047](https://github.com/googlefonts/noto-emoji/tree/v2.047/svg), [Apache 2.0 para SVG](https://github.com/googlefonts/noto-emoji/blob/v2.047/svg/LICENSE). As licenças e três animais de cada banco estão nos artefatos de comparação. Freeicons não pôde ser consultado pela ferramenta web; não foi usado. OpenMoji não foi incorporado.

Escolha: SVGs próprios do Quintal. Fluent é chapado e amigável, mas não tem o contorno de tinta; Noto usa sombreado e maior detalhamento. Alterá-los a ponto de cumprir o traço exigiria redesenho. O conjunto próprio usa formas arredondadas e somente `quintalColors`, com olhos/boca claros na pelagem escura. Origem: `src/shared/ui/media/PetAvatar/PetAvatar.tsx`, criado nesta tarefa; desenhos disponibilizados em CC0 1.0, conforme `ARTWORK-LICENSE.md`. Não são derivações dos candidatos.

SVG inline evita 14 requisições e arquivos com geometria repetida: a face de cão/gato compartilha estrutura, variando pelagem, orelhas, manchas e traços. Nenhuma lib/asset gerado por IA foi adicionada. ViewBox 64; círculos leves em luz/céu/grama e stroke arredondado. O hash unsigned base 31 do id produz índice 0–3; não depende de nome, viewport ou montagem. Mudança do algoritmo mudaria a identidade visual e exige migração explícita.

API: `PetAvatar({petId,name,species,src,size=40,...AvatarProps})`. `src` inválido usa o fallback nativo do MUI; SVG `aria-hidden`, contêiner `role=img` e `aria-label=name`. Consumidores com nome visível passam `aria-hidden=true`. `PetProfileCard.petId` permite id estável em ficha e reserva; cadastro usa `draft`. `StayBookingPet.species` é opcional para compatibilidade com projeções antigas, mas a rota real o fornece.

Exceção de marca: desenho apenas substitui foto ausente, inclusive formulário/ficha; não é decoração da tela. Registro no vault em `decisoes/2026-10-25-avatar-do-pet.md`.
