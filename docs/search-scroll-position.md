# Rolagem ao buscar

`src/features/search/hooks/useSearchUrl.ts` conserva a interface `{ query, update }`.
`update(next)` escreve os filtros no histórico nativo e volta imediatamente ao topo
com `scrollTo({ top: 0, left: 0, behavior: "instant" })`. Consumidores: SearchBar
na HomeScreen, SearchSummaryBar, filtros e expansão do raio via useSearch.

Isso impede que a posição antiga perto do rodapé seja mantida quando uma busca
retorna poucos cantinhos. Sem animação, inclusive para movimento reduzido. Não
atua ao montar, receber dados, carregar mais resultados ou navegar pelo histórico;
esses caminhos conservam seu comportamento anterior. Sem novo recurso público,
provider ou dependência; efeito apenas no navegador, sem alteração do HTTP.

Validação: useSearchUrl.test.tsx cobre escrita da URL, ausência de rolagem na
montagem e retorno ao topo na busca. SearchSummaryBar.test.tsx cobre o envio pelo
diálogo. Cinco testes aprovados; typecheck e ESLint dos arquivos alterados aprovados.
Regressão de navegador acrescentada em e2e/mocked/home/search.spec.ts para desktop
e celular: partir do rodapé, filtrar e conferir topo/título visível. Execução bloqueada
porque já há um Next dev nesta worktree (porta 3000); o runner não pôde iniciar
outro na 3100. Servidor existente preservado. Não declarar E2E aprovado.
