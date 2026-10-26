# Validação — 105

## Revisão r1 — 25/10/2026

- Copy centralizada em `conversationsCopy.booking`; `UnreadBadge` extraído da lista e compartilhado via índice público client; comentários novos traduzidos para português com exemplos.
- `npx vitest run src/widgets/booking-conversation src/features/conversations src/features/bookings/components/client/StayDetail.test.tsx src/features/bookings/components/client/HostBookingDetail.int.test.tsx`: **16 arquivos, 87 testes aprovados**. Depois do ajuste final do nome acessível, `npx vitest run src/widgets/booking-conversation`: **10 testes aprovados**. Cobrem contador zero, singular e plural, número visual no selo e ausência do sufixo entre parênteses. Lista existente continua usando o mesmo componente extraído.
- `npx vitest run --config vitest.105.tmp.config.ts src/app/BookingConversationPreview.stories.tsx src/features/conversations/components/client/ConversationList/ConversationList.stories.tsx src/features/bookings/components/client/StayDetail.stories.tsx src/features/bookings/components/client/HostBookingDetail.stories.tsx`: **4 arquivos, 19 stories aprovadas**, incluindo a11y. O nome acessível é derivado do conteúdo do link e da frase oculta do selo, gerada por `conversationsCopy.unread(count)`; não há `aria-label` sobrepondo o conteúdo, evitando divergência com o texto visível.
- Prints `test-results/105/anfitriao-1440.png` e `anfitriao-390.png` refeitos pelo runner de stories e revisados; texto do botão e selo em uma linha no cenário de 390. Demais prints preservados.
- Typecheck, ESLint dos arquivos alterados e diff-check aprovados. Config temporário com `server.fs.allow` e setup de captura removidos. UTF-8 sem BOM.
- Documentação e catálogo do vault atualizados para copy e selo compartilhado. Níveis funcional/integração e stories cobrem esta apresentação trivial; unitário isolado do selo não acrescentaria regra distinta. E2E não executado, conforme brief. Limites de API da entrega inicial permanecem.

Executado em 25/10/2026, worktree `pethost_frontend-105`, branch `feat/105-chat-na-reserva`. Sem instalação de dependências; junction de node_modules preservada.

## Comportamento

`npx vitest run src/widgets/booking-conversation src/features/conversations src/features/bookings/api src/features/bookings/components/client/StayDetail.test.tsx src/features/bookings/components/client/HostBookingDetail.int.test.tsx src/widgets/conversation-panel/lib/stayContext.test.ts`

**20 arquivos, 105 testes aprovados.** Unitários dos mapeadores cobrem preservação de IDs sem objetos de exibição. Integração funcional com MSW cobre POST/listingId e navegação, envio único, erros de bloqueio/próprio cantinho/rede, liberação para retry, conversa bloqueada com não lidas e tutor sem exibição, ausência, erro de consulta e limite de página. Suítes existentes dos detalhes, cliente, componentes/hooks de conversas, mapeadores e consumidor de contexto incluídas. Não foram criadas suítes unitárias redundantes para os wrappers triviais cobertos por integração.

## Stories e prints

`npx vitest run --config vitest.105.tmp.config.ts src/features/bookings/components/client/StayDetail.stories.tsx src/features/bookings/components/client/HostBookingDetail.stories.tsx src/app/BookingConversationPreview.stories.tsx`

**3 arquivos, 16 stories aprovadas no Chromium**, incluindo 13 originais e 3 composições novas. Config temporário derivado do original com `server.fs.allow: ["C:/Users/Renato Lopes/Desktop/PetHost"]`; dependências preotimizadas para impedir reload durante a suíte. Config e setup de captura removidos após execução. Warning não bloqueante do Vite sobre futura mudança do carregamento de configs CommonJS.

Captura adicional das três stories novas pelo runner Storybook/Vitest, com viewport nas larguras 1440 e 390 e altura expandida ao conteúdo. Isso não executa jornadas E2E da aplicação. Prints revisados visualmente; ação secundária no começo, sem deslocamento horizontal e separada da resposta/pagamento:

- `test-results/105/tutor-1440.png`, `tutor-390.png`;
- `test-results/105/anfitriao-1440.png`, `anfitriao-390.png`;
- `test-results/105/anfitriao-sem-conversa-1440.png`, `anfitriao-sem-conversa-390.png`.

Os arquivos de imagem ficam no diretório de resultados ignorado pelo Git, conforme a estrutura existente. O servidor completo `storybook dev` foi tentado e falhou por EPERM ao gravar configurações globais e acesso de esbuild ao diretório pai; captura concluída pelo runner de stories, sem alterar permissões nem arquivos globais.

## Checks e documentação

ESLint dos arquivos alterados aprovado, incluindo boundaries. `npm run typecheck` aprovado. `git diff --check` aprovado. Paths de documentação e links da entrega conferidos contra arquivos reais. Arquivos escritos em UTF-8 sem BOM. Notas atualizadas no vault compartilhado: bookings, conversations, booking-conversation, resource-catalog e frontend-folder-responsibilities; não integram a branch frontend, pois o vault é outro repositório compartilhado com alterações preexistentes.

## Limitações explícitas

E2E **não executado**, conforme instrução do brief; execução fica para CI. Não foi acrescentado passo dependente de chat aos specs mocked, pois o mock atual não implementa endpoints de conversas. Não validada integração com API real.

Anfitrião não pode iniciar conversa pela API. Consulta reutilizada é página 1 de 50 itens, sem filtro por tutor; quando cheia, a mensagem qualifica o recorte, sem afirmar inexistência absoluta. A lista de conversas também compartilha esse limite. Lookup direcionado/paginação completa são lacunas de API/produto; nenhum endpoint ou filtro inventado.
