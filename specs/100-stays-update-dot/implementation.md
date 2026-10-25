# 100: novidades em Minhas estadias

Implementado em `feat/100-stays-update-dot`, worktree `pethost_frontend-100`.

## Contrato e fluxo

- `shared/lib/seenSnapshots.ts`: `SeenSnapshot = Record<string, string>` e `seenSnapshots.read(key)` / `write(key, snapshot)`. Retornam snapshot, `null` quando ainda não existe e `undefined` em falha. Banco nativo `pethost-seen` v1, store `snapshots`; escrita só resolve no commit, abertura bloqueada expira em 2 s e conexão tardia fecha. Sem pacote novo nem fallback que gere avisos sem persistência.
- `features/bookings/lib/stayUpdates.ts`: `staySnapshot(bookings)` guarda id e assinatura de status, responseDeadline, paymentDeadline, checkedInAt, checkedOutAt, cancelledBy e refundPercentage. Não guarda nomes, contatos ou timestamps de leitura. `hasStayUpdates(current, seen)` ignora primeira visita e remoções; detecta itens novos e assinaturas diferentes. Parcelas não existem no contrato atual de `Booking`: nenhuma consulta ou campo de pagamento foi inventado.
- `features/bookings/hooks/useStayUpdates.ts`: `useStayUpdates(accountId, pathname): boolean`. Apenas cliente com QueryClientProvider. Reutiliza `bookingQueries.infinite(accountId, BOOKING_STATUSES)`, página de 20, sem query paralela de listas. Completa todas as páginas antes de comparar/persistir. TanStack refaz consultas stale ao voltar o foco; staleTime de produção é 60 s, sem polling. Sem IndexedDB, desabilita as queries do indicador.
- Chave persistida `owner-stays:${accountId}`. Primeira leitura ausente salva o estado atual silenciosamente. Em `/owner/bookings` reconhece a lista inteira. Em `/owner/bookings/:id` só reconhece o detalhe carregado com sucesso, preservando outros avisos. O detalhe atualiza o item no cache da lista quando é mais recente, para a versão antiga não reacender o indicador ao sair. Um detalhe antigo com assinatura diferente não sobrescreve nem o cache nem o snapshot já visto. Fetch/erro parcial não substitui snapshot.
- `widgets/app-shell/components/client/OwnerHeaderNav.tsx`: ilha de composição com accountId e items; AppHeader monta apenas para tutor e usa key por conta. Atualizações do hook renderizam a ilha e o HeaderNav, sem alterar o estado do AppHeader. Sem provider/store novo.
- `HeaderNav` aceita `stayUpdates?: boolean` (false). Aplica apenas a owner-stays, desktop e gaveta: ponto 7 px no canto do rótulo, token `quintal.coral`, decorativo. O nome acessível ganha `(há novidades)` usando `shellCopy.updates`, sem live region. Os links, foco e aria-current existentes são preservados.
- Índices públicos: hook e bookingQueries no `index.client.ts`; BOOKING_STATUSES no `index.ts`. Stories AppShell semeiam a query real com lista vazia e staleTime infinito, sem rede. HeaderNav possui stories Seen, Updates e MobileUpdates; composição da ilha coberta pelo AppShell Tutor/Celular.

## Reutilização e limites

Catálogo consultado: bookings, NAV_ITEMS/HeaderNav e AppHeader. Código consultado: queries, contratos, mappers, StayList, tokens, providers/test helpers. Não havia IndexedDB ou pacote idb no projeto; wrapper nativo concentra somente persistência opaca. Regras de comparação permanecem na feature; shared não conhece Booking. Nenhuma pasta técnica nova; arquivos entram nos diretórios existentes. `SeenSnapshot` não serve para cache de dados de negócio nem sincronização de leitura entre dispositivos. Não há sincronização instantânea entre abas: foco/refetch relê o snapshot persistido.

## Validação

- Unitário: `src/features/bookings/lib/stayUpdates.test.ts` cobre primeira visita, remoção, ausência de mudança, timestamps irrelevantes e mudanças relevantes. `src/shared/lib/seenSnapshots.test.ts` cobre chave por conta, leitura, commit, conexão fechada, ausência, bloqueio, timeout, erro, abort e dados inválidos usando double privado da API nativa (fake-indexeddb não instalado).
- Funcional/integração: `src/widgets/app-shell/components/client/OwnerHeaderNav.int.test.tsx`, TanStack/providers reais e MSW HTTP, mock apenas da porta IndexedDB/router: primeira visita, desktop/gaveta, lista, detalhe único/múltiplo, cache antigo, contas, paginação, foco e falhas. Regressões existentes AppHeader, AppShell e HeaderNav também executadas.
- E2E aplicável à persistência real após reload e jornada entre rotas, mas execução delegada ao CI pelo brief, devido à RAM. Não foi executada suíte Playwright nem API real. Double IndexedDB não equivale a teste em browser real.
- Evidências e resultados finais: ver nota `development/resources/stay-updates` no vault. Capturas isoladas de stories não equivalem a E2E nem comparação com Figma; nenhuma prancha específica foi fornecida no brief.

### Resultados executados

Rodada completa selecionada: 6 arquivos e 44 testes aprovados. Após acrescentar as duas regressões de cache: OwnerHeaderNav 12/12, AppHeader 6/6 e HeaderNav 7/7 aprovados em execuções selecionadas. Uma rodada intermediária terminou com timeout ao iniciar o worker de HeaderNav, corrigido pela reexecução isolada, sem alteração do produto. São 46 casos distintos aprovados combinando as execuções, não uma rodada única de 46. TypeScript, lint dos arquivos alterados e diff check passaram.

Storybook dev limitado a HeaderNav.stories.tsx falhou por EPERM em settings global e acesso negado/cache do esbuild. Nenhuma captura foi produzida, nenhum play/a11y de story executado. E2E e comparação Figma continuam pendentes para CI/revisão. Configuração temporária de reprodução em `test-results/storybook-100/` (ignorada pelo Git). Nenhum pacote instalado e nenhum push.
