# Loader no primeiro acesso e ícone de localização

Status: implementado em 29/10/2026, sem deploy.

## TurmaDog, turmaPosters e gerador

`src/shared/ui/brand/TurmaWalker/TurmaDog.tsx` preserva `member`, `height` e `still?`. Renderiza o primeiro quadro real embutido antes de depender da rede ou de hidratação. No modo animado, solicita `turmaSrc(member)` e aguarda `Image.decode()` antes de trocar o `src`. Falha de download/decodificação mantém o quadro real; erro da imagem exibida restaura esse quadro. Cleanup remove o callback e ignora conclusões tardias. Mudança de membro não mostra o arquivo pronto do membro anterior. `still` explícito tem prioridade sobre movimento reduzido.

O canvas `StillFrame` foi removido: movimento reduzido utiliza a imagem estática embutida, sem baixar a animação pelo componente. O preload global dos WebPs permanece no layout, inclusive em movimento reduzido. Cães decorativos; status acessível permanece no `SniffLoader`.

`src/shared/ui/brand/turmaPosters.ts` exporta `turmaPosters`, mapa interno consumido por `TurmaDog`. Gerado por `scripts/generate-turma-posters.mjs` via `npm run brand:turma-posters`: extrai o primeiro quadro dos três WebPs existentes, preserva transparência, reduz para 128px e produz data URLs WebP com Sharp/Prettier disponíveis no projeto. Aproximadamente 20KB de fonte antes de compressão. Sem duplicar assets no public. Se os originais mudarem, executar o comando; não editar os dados gerados manualmente. Não é pipeline de imagens de usuários.

## TurmaWalker

`src/shared/ui/brand/TurmaWalker/TurmaWalker.tsx` mantém props e consumidores. `loop` começa 40% de uma travessia adiantado para haver um cachorro na pista imediatamente. `once` mantém a entrada completa. Movimento reduzido mantém os cães lado a lado. Nenhum timer/store/provider adicional.

## SearchBar

`src/features/search/components/client/SearchBar/SearchBar.tsx` mantém props, validação e callbacks. Onde inclui SVG de localização decorativo de 24px, traço 2px/currentColor, alinhado ao centro com gap de 8px. Label associado ao input; ícone sem foco nem nome redundante. Sem geolocalização ou mudança na busca. Sem novo componente público de ícone.

## Validação e limites

Funcionais: `TurmaWalker.test.tsx` cobre quadro embutido, loop/once, movimento reduzido, decode pendente/concluído/falha, recuperação e cleanup. `src/app/loading.test.tsx`, `src/app/listings/[listingId]/loading.test.tsx`, `src/app/layout.test.tsx` e `brand.test.tsx` cobrem status, Suspense, preload e composição. `SearchBar.test.tsx` cobre validação, edição e envio. Unitário separado N/A: lógica interna coberta pela composição. Backend/HTTP real N/A: assets locais e apresentação; nenhuma API mudou.

Chromium com os componentes reais e SSR em harness privado: 390/1440px, com/sem JavaScript, WebPs externos recusados (503). Quatro verificações aprovadas: três cães decodificados por data URL e ícone visível. Valida browser com rede indisponível, não jornada Next/API publicada. Evidências em `.agent-tools/loader-cold-*.png`, fora do Git. Checks finais registrados abaixo.

Resultados: 22 testes aprovados nos cinco arquivos de loader/layout/marca. Os dois testes existentes de SearchBar expiraram com timeout padrão de 5s na execução conjunta; repetidos isoladamente com `--maxWorkers=1 --testTimeout=20000`, ambos passaram. Comandos: `npx vitest run src/shared/ui/brand/TurmaWalker/TurmaWalker.test.tsx src/shared/ui/brand/brand.test.tsx src/app/loading.test.tsx src/app/layout.test.tsx 'src/app/listings/[listingId]/loading.test.tsx' src/features/search/components/client/SearchBar/SearchBar.test.tsx --maxWorkers=2`; repetição: `npx vitest run src/features/search/components/client/SearchBar/SearchBar.test.tsx --maxWorkers=1 --testTimeout=20000`. Typecheck global e ESLint dos recursos alterados aprovados; Prettier aplicado; geração dos posters executada. Sem build, push ou deploy desta correção. A renderização SSR isolada não substitui validação da primeira visita na Vercel.
