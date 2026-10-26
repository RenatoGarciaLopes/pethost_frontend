# Validação — 106

## Revisão r1 — legibilidade e alvos de toque

Trocar/Tirar passaram para o menu nas fotos com reordenação; o botão ⋯ usa alvo mínimo 44×44 px e fonte 15 px/700 em `text.primary`. Os itens do menu usam fonte 14 px/700 na mesma cor, altura mínima 44 px, padding e margem vertical. Sem reordenação, as ações diretas recebem os mesmos mínimos de legibilidade e toque, com gap e quebra de linha.

- `node node_modules/vitest/vitest.mjs run src/shared/ui/media/PhotoSlots/PhotoSlots.test.tsx src/features/host-listings/components/client/ListingPhotosSection.int.test.tsx src/features/pets/components/client/PetEditor.int.test.tsx --maxWorkers=2`: **3 arquivos, 32 testes aprovados**. Inclui troca e remoção pelo menu, mantendo índices e validação do input nativo.
- Storybook-vitest com configuração temporária de `server.fs.allow` e viewport 390×844: **6 stories aprovadas**, incluindo axe e medidas reais de botão/itens, tamanho/peso de fonte e igualdade da cor. Medição dos itens aguarda o Grow terminar para avaliar o alvo final, não seu retângulo durante a animação.
- Typecheck global, ESLint de PhotoSlots, Prettier dos arquivos alterados e `git diff --check`: aprovados.
- Refeitos `test-results/106/390-paradas.png`, `390-menu.png` e `1440-paradas.png`. Captura Chromium confirmou alvo ≥44×44 px, fontes 14/15 px em peso 700, cor igual entre opções e menu, e ausência de overflow. Os outros cinco prints permanecem como evidência da rodada inicial aprovada.
- E2E não executado, conforme brief. A configuração temporária foi removida. Sem dependências novas, mudança no contrato, instalação, push ou PR.

Executada em 25/10/2026, worktree `pethost_frontend-106`, branch `feat/106-fotos-arrastar`. Nenhum pacote instalado durante a execução; manifests previamente alterados pelo solicitante fazem parte da entrega.

## Componente e consumidores

Comando:

```sh
node node_modules/vitest/vitest.mjs run src/shared/ui/media/PhotoSlots/PhotoSlots.test.tsx src/features/host-listings/components/client/ListingEditor.int.test.tsx src/features/host-listings/hooks/useListingPhotoMutations.int.test.tsx src/features/pets/components/client/PetEditor.int.test.tsx src/features/pets/hooks/usePetPhotoMutations.int.test.tsx --maxWorkers=2
```

Resultado: **5 arquivos, 46 testes aprovados**. A rodada inicial identificou perda do nome acessível de Trocar ao compactar a linha; corrigida com aria-label explícito no input. A execução acima aprovou os consumidores após a correção.

```sh
node node_modules/vitest/vitest.mjs run --project integration-dom src/features/host-listings/components/client/ListingPhotosSection.int.test.tsx
```

Resultado: **1 arquivo, 1 teste aprovado**. Menu da terceira foto envia `photoIds` na ordem completa à rota PUT existente e bloqueia sensores/ações até a resposta. Timeout de 20 s acompanha o padrão do ListingEditor nesta máquina; a tentativa com limite padrão de 5 s expirou. Teste usa HTTP simulado por MSW, sem integração real com backend.

Níveis: funcional cobre escolha/remoção/troca, arquivo inválido, menu/destinos aplicáveis, Escape, vagas vazias e bloqueios. Integração cobre consumidores, providers/query e transporte simulado. Unitários separados da fábrica de copy e callbacks triviais são N/A: comportamento coberto na composição. Não há helper/fixture reutilizável novo.

## Stories no Chromium

```sh
node node_modules/vitest/vitest.mjs run --config vitest.storybook-106.config.ts src/shared/ui/media/PhotoSlots/PhotoSlots.stories.tsx
node node_modules/vitest/vitest.mjs run --config vitest.storybook-106-mobile.config.ts src/shared/ui/media/PhotoSlots/PhotoSlots.stories.tsx
```

**6 stories aprovadas em cada viewport**, incluindo auditoria axe: teclado espaço/setas/espaço leva 3 para 1 e chama `(2, 0)`; Escape não chama; mouse só chama ao soltar; salvar sem atualização otimista mantém posição transitória, falha restaura a ordem, e envio posterior não ressuscita a ordem que falhou. A execução de ponteiro aguarda os 340 ms da animação anterior antes de medir posições.

Configs temporários derivados de `vitest.storybook.config.ts`, com `server.fs.allow: ["C:/Users/Renato Lopes/Desktop/PetHost"]`; configuração mobile também recebe viewport 390×844. Ambos removidos após execução. Não há mudança permanente na configuração do runner.

Limitações reais do runner: aviso do Vite sobre configuração TS carregada como CommonJS; uma execução desktop terminou os seis testes com exit 0, mas precisou encerrar o processo de browser após timeout de shutdown. A rodada mobile encerrou normalmente. Nenhuma falha de comportamento ou axe ficou pendente.

## Evidência visual

Oito arquivos em `test-results/106/`, ignorados pelo Git conforme configuração existente:

| Largura | Paradas            | Arraste em andamento | Menu            | Foco por teclado |
| ------- | ------------------ | -------------------- | --------------- | ---------------- |
| 1440    | `1440-paradas.png` | `1440-arraste.png`   | `1440-menu.png` | `1440-foco.png`  |
| 390     | `390-paradas.png`  | `390-arraste.png`    | `390-menu.png`  | `390-foco.png`   |

Capturados por Playwright sobre o preview da story, com imagens SVG sintéticas sem rede. Assertivas auxiliares confirmaram ausência de overflow horizontal e, em reduced motion, foto pega sem rotação ou transição. Não é execução de suíte E2E.

Portal Maestri abriu a página, mas screenshot expirou (página não renderizando na janela). Diagnóstico `maestri debug` confirmou conexão; fallback foi Chromium headless. Storybook completo também falhou ao gerar manager/cache nesta sandbox; `--preview-only` serviu a story normalmente. O aviso de escrita negada de settings/registro global não impediu o preview nem os testes.

## Checks e documentação

ESLint dos arquivos alterados: aprovado. Typecheck global (`node node_modules/typescript/bin/tsc --noEmit`): aprovado. Prettier dos arquivos alterados: aprovado após formatação da nota final. `git diff --check`: aprovado.

Busca por `Mover a foto` e `Usar como capa` em `e2e/`: nenhuma ocorrência de seletores antigos, portanto nenhuma alteração artificial de E2E. **E2E não executado por instrução do solicitante; CI pendente.** Não foi executado build de produção nem validação contra API real.

REQ-LIST-014, JSDoc, arquitetura/dependências, árvore real, nota `development/resources/photo-slots.md`, catálogo, responsabilidades e notas de host-listings/frontend-tooling atualizados. Paths e links da nova nota conferidos contra a worktree. O vault é um repositório separado já com mudanças de outras tarefas; suas atualizações locais foram preservadas sem incluir alterações alheias no commit do frontend.
