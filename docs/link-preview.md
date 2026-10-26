# Prévia de links e ícone do iPhone (29/10/2026)

## Problema e decisão

Links do site colados no WhatsApp mostravam o `favicon.ico` (48 px) esticado, porque não havia `og:image`. WhatsApp, Facebook, Telegram e LinkedIn não leem SVG em prévias, então o `icon.svg` não resolve: a prévia precisa de PNG/JPG grande e com URL absoluta.

## Arquivos e interfaces

- `src/app/opengraph-image.png` (1200×630, ~32 KB) e `src/app/opengraph-image.alt.txt`: convenção de arquivo do Next. Gera `og:image`, `og:image:width/height/type/alt` e as equivalentes `twitter:image*` em todas as rotas, com hash de cache na URL. Composição: porta do `DoorMark` (traço 6, maçaneta 4) + assinatura `pethost` em Caprasimo, frase "Hospedagem de pets perto de casa." em Atkinson 700, sol gema e três cães da turma no gramado, sem encostar na porta (vault `marca/04-logo.md`: nunca bicho no logo).
- `src/app/apple-icon.png` (180×180, porta traço 8 sobre papel): declarado em `metadata.icons.apple`, porque o `icons` explícito do layout impede o Next de publicar o ícone por arquivo sozinho.
- `src/app/layout.tsx`: `metadataBase: https://pethost.cfd` (URLs absolutas exigidas pelos crawlers), `openGraph` com `type`, `siteName` e `locale`, e `twitter.card = summary_large_image`. Títulos e descrições continuam vindo do `title`/`description` de cada rota.

## Geração

`npm run brand:share-images` executa `scripts/generate-share-images.mjs`. Ele lê os paths e a maçaneta do `DoorMark.tsx` e as cores de `tokens/colors.ts`, extrai com Sharp o primeiro quadro real de `public/brand/turma/*.webp` (320×238) e carrega as fontes de `public/fonts/` interceptadas, sem rede, pelo Playwright/Chromium. Ele falha se a marca mudar de forma ou se as fontes não carregarem, e o PNG sai com paleta para ficar abaixo de 300 KB (o WhatsApp ignora imagens pesadas). Rode o gerador de novo quando mudar a porta, as cores, as fontes, a frase ou a turma, e não edite os PNGs à mão.

## Limites

O WhatsApp guarda a prévia de cada URL em cache: links já compartilhados podem seguir com a miniatura antiga, e para testar na hora vale usar `https://pethost.cfd/?v=2`. Prévias e cantinhos ganham a mesma imagem do site. Uma imagem por cantinho (foto do anúncio) exigiria `generateMetadata` na rota pública e fica fora desta entrega. Deploy de preview aponta para as imagens de produção, por causa do `metadataBase`.

## Validação

`src/app/layout.test.tsx` cobre os metadados (`metadataBase`, `openGraph`, `twitter`, `icons.apple`, texto alternativo) e confere que os dois arquivos são PNG nas dimensões certas e abaixo de 300 KB. Build de produção com `next start` local: o `<head>` de `/` e `/login` traz `og:image` absoluto, com 1200×630, `twitter:card summary_large_image` e `apple-touch-icon`, e as duas imagens respondem 200 `image/png`. A imagem gerada foi conferida visualmente. E2E não se aplica, porque não há jornada no navegador, apenas tags e arquivos estáticos já cobertos pelo build. A prévia real no WhatsApp depende do deploy e não foi validada.
