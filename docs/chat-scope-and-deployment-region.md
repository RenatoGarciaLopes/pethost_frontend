# Chat e região de execução

## Assinatura restrita ao chat

`src/widgets/conversation-panel/components/client/ConversationsShell.tsx` chama
`useConversationsRealtime(accountId)` enquanto a rota autenticada `/conversations`
ou `/conversations/[conversationId]` está montada. O hook existente em
`src/features/conversations/hooks/useConversationsRealtime.ts` mantém interface,
QueryClient e limpeza por efeito. Trocar contatos conserva a assinatura; sair da
rota libera a conexão e seus temporizadores pelo cliente existente.

`AppHeader` mantém sua interface e não inicia realtime. Fora do chat, avisos não
recebem eventos instantâneos; as consultas REST existentes continuam funcionando.
O polling dentro do chat continua como recuperação quando o hub não conecta.
Não foi criado provider, transporte ou estado paralelo.

## Vercel em São Paulo

`vercel.json` define `regions: ["gru1"]` para as funções do projeto, incluindo
renderização dinâmica e BFF. Não há export `preferredRegion`: essa API está
deprecated na versão instalada do Next.js. A configuração exige um novo deploy
para valer; não altera um deployment já publicado. Arquivos estáticos continuam
na CDN global. Isso não garante residência exclusiva de todos os dados, logs,
builds e serviços externos no Brasil.

Referências: [regiões de funções](https://vercel.com/docs/functions/configuring-functions/region)
e [códigos de regiões](https://vercel.com/docs/regions).

## Validação

`ConversationsShell.test.tsx` e `AppHeader.test.tsx` cobre cabeçalho fora do chat sem assinatura,
entrada no chat, troca de contato sem reconexão e encerramento ao sair,
usando o hook real com transporte substituído. Testes existentes do cliente
cobrem fechamento do stream, timers e recuperação. Não há função pura nova.
E2E com backend real e região efetiva do deployment dependem de publicação;
não foram validados em produção nesta entrega.

Verificacao local: 4 arquivos Vitest, 14 testes aprovados (casca, cabecalho,
hook e transporte); typecheck aprovado; Prettier dos arquivos alterados aprovado.

ESLint dos arquivos alterados aprovado. Lint global interrompido pela duracao; sem validacao de deploy/build nesta entrega.
