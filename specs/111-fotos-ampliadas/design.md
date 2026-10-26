# Desenho

`ListingGallery` é uma ilha client com estado do índice aberto e detector de arraste do carrossel. Reutiliza `DoorMark`, `Sticker`, tokens e foco Quintal. As molduras contêm botões acessíveis; não há botões aninhados. Ativação por teclado ignora um arraste anterior.

`shared/ui/media/PhotoLightbox` é compartilhável, independente de listing-page. Recebe `photos: readonly { id; url }[]`, `title`, `initialIndex`, `open` e `onClose`. Monte uma instância por abertura para resetar estado; `ListingGallery` faz isso com montagem condicional e `key`. O índice inicial é limitado à lista. Lista vazia não monta diálogo.

O Dialog MUI cuida do foco, Escape, bloqueio de rolagem e portal. `useMediaQuery` considera `prefers-reduced-motion`. Sem dependência nova, API, store, permissão ou HTTP.

Pointer events controlam pinça, arraste e swipe. A escala fica entre 1 e 4. Os limites de translação usam o tamanho real da foto em `object-fit: contain`, suas dimensões naturais e o retângulo disponível. Um dedo remanescente após pinça pode arrastar sem saltar. Navegar apaga ponteiros, zoom e toque anterior. Cancelamento de ponteiro apaga gestos pendentes.

O contrato `GetApiV1ListingsListingIdResponse` expõe fotos com `id`, `url` e `position`, sem URL separada de alta resolução. A única `url` é usada intacta em galeria, visualizador e miniaturas. Não há URL fabricada ou transformação de CDN.

Reutilização descoberta: não existia visualizador/zoom em shared; `PhotoSlots` edita uploads e `InitialsAvatar` representa pessoas. Não atendem à leitura de fotos. Conversas/pets poderão compor o visualizador no futuro, mas não foram alterados nesta tarefa.

Testes de componentes cobrem funções internas pela composição (não há utilitário puro exportado). Stories Chromium cobrem gestos/geometria/foco e a11y. Não há integração HTTP nova: a galeria consome o contrato já validado pela feature. E2E mocked é regressão de composição, sem equivalência à API real.
