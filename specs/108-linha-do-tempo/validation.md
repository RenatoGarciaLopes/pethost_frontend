# Validação — 108

## Retomada de 26/10/2026

- `node node_modules/vitest/vitest.mjs run src/shared/ui/data-display/StatusTimeline src/features/bookings/lib/stayDetailView.test.ts src/features/bookings/lib/bookingStatus.test.ts src/features/bookings/components/client/StayDetail.test.tsx --maxWorkers=1`: **27 testes, 4 arquivos aprovados**.
- Storybook-vitest com configuração temporária derivada da existente e `server.fs.allow` para a raiz do workspace: StatusTimeline e ApplicationStatusView, **12 stories aprovadas**, incluindo axe. Após acrescentar cenários da estadia em largura útil de 340 px e cancelamento, **5 stories do StatusTimeline aprovadas**. O play verifica quatro colunas iguais, alinhadas horizontalmente, sem overflow, além de `aria-current` e encerramento sem controles interativos.
- `node node_modules/typescript/bin/tsc --noEmit`: aprovado antes das novas stories; check final registrado na integração.
- Capturas históricas inspecionadas nesta retomada: `test-results/108/reserva-tutor-390-depois.png` e `reserva-cancelada-1440-depois.png`. Quatro marcos lado a lado no celular; cancelada termina com marcador coral e sem marcos futuros. As capturas não foram refeitas nesta rodada.

## Níveis e cobertura

Unitários: `stayDetailView.test.ts` e `bookingStatus.test.ts`, estados de estadia e datas previstas/reais sem inventar horário. Funcionais: StatusTimeline.test.tsx e StayDetail.test.tsx, semântica, estados textuais, etapa atual e consumo no detalhe. Integração: consumidores de bookings e ApplicationStatusView na rodada ampliada da retomada. Stories Chromium verificam layout real e acessibilidade. E2E com backend simulado continua sendo uma jornada diferente de integração com API real; não houve execução contra a API real.

## Histórico preservado

A sessão anterior teve rodadas amplas com 30 e 38 falhas, seguidas de recortes verdes (55 e 25 testes), e foi interrompida antes das stories finais. Esses recortes não provam resolução de toda a rodada ampla. A retomada registra cada resultado novo separadamente; nenhuma falha histórica é atribuída a carga sem evidência. Não há helper de teste reutilizável novo.

## Regressão ampliada

`node node_modules/vitest/vitest.mjs run src/features/bookings src/shared/ui/data-display/StatusTimeline src/features/host-applications/components/client/ApplicationStatusView --maxWorkers=1`: **168 testes em 27 arquivos aprovados**, cobrindo consumidores de reservas e verificação. A repetição dos 32 testes da 106 após merge também passou na dev.

## Compartilhados e verificação

`node node_modules/vitest/vitest.mjs run src/shared/ui src/features/host-applications --maxWorkers=1`: 331/332 testes, 64/65 arquivos aprovados. Única falha: Calendar.test.tsx, caso de chegada/saída, excedeu 5000 ms. Reexecução isolada do arquivo, sem alterar timeout nem código: 19/19 aprovados. A rodada ampla não é declarada aprovada; instabilidade de tempo permanece registrada. Nenhum arquivo de Calendar foi modificado.

ESLint identificou borderRadius numérico na pílula; substituído por quintalRadii.pill. Após correção, ESLint passou e as 5 stories passaram novamente. Typecheck global, Prettier e diff --check aprovados. E2E my-stays ganhou assertivas de geometria horizontal/sem overflow e de encerramento cancelado; execução coordenada após integrar.

## E2E da integração (26/10/2026)

Worktree isolada de validação a partir da dev integrada, Next webpack na porta 3180 e backend simulado na 5099, preservando o servidor do usuário na 3000. Comando: `node node_modules/@playwright/test/cli.js test --config playwright.recovery.tmp.config.ts e2e/mocked/bookings/my-stays.spec.ts e2e/mocked/search/listing-page.spec.ts e2e/mocked/pets/new-pet.spec.ts e2e/mocked/pets/pet-profile.spec.ts --grep "REQ-STAYS-001|REQ-STAYS-006|REQ-LPAGE-001|REQ-PNEW-016|REQ-PEDIT-004" --project=mocked-desktop --project=mocked-mobile --workers=1` (segunda rodada com `--last-failed`, que executou novamente os dez casos). **10/10 aprovados, 2,9 min na segunda rodada**.

Primeira rodada: timeouts de navegação/compilação em rotas frias no desktop e seletor novo de cancelamento que buscava texto isolado apesar da vírgula acessível no marcador. Seletor corrigido para conferir o marco Cancelada/parou; a repetição passou sem aumentar os timeouts. Logs de desenvolvimento também registraram falha ao carregar Stripe.js externo; esses casos não validam o SDK real nem pagamento. Backend simulado não equivale à integração com API real. Configuração temporária removida na entrega; resultados locais em `.agent-tools/recovery-e2e-repeat.log`, fora do Git.
