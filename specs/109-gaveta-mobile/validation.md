# Validação — 109

- `npx vitest run src/widgets/app-shell`: **7 arquivos, 56 testes aprovados** (rodada isolada do `HeaderNav.test.tsx`: 9 aprovados). Numa rodada concorrente com outros processos, um teste de `OwnerHeaderNav.int.test.tsx` (reconhecimento de estadia) falhou por tempo; passou isolado e na rodada seguinte; não toca a gaveta.
- Stories no storybook-vitest (config temporário com `server.fs.allow`, apagado): `src/widgets/app-shell` **2 arquivos, 10 stories aprovadas**, incluindo a11y. A primeira rodada pegou `aria-dialog-name` ao tirar o nome do paper; corrigido.
- `tsc --noEmit`, `eslint src/widgets/app-shell` e `prettier --check` sem erros.
- Prints (next dev --webpack + mock): `test-results/109/antes-*` e `depois-*`: `390-fechado`, `390-gaveta-owner`, `390-gaveta-host`, `1440-cabecalho` (computador sem mudança).
- E2E não executado: vai para o CI.
