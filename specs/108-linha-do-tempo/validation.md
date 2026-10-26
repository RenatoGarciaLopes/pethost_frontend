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

## Regress?o ampliada

`node node_modules/vitest/vitest.mjs run src/features/bookings src/shared/ui/data-display/StatusTimeline src/features/host-applications/components/client/ApplicationStatusView --maxWorkers=1`: **168 testes em 27 arquivos aprovados**, cobrindo consumidores de reservas e verifica??o. A repeti??o dos 32 testes da 106 ap?s merge tamb?m passou na dev.

## Compartilhados e verifica??o

`node node_modules/vitest/vitest.mjs run src/shared/ui src/features/host-applications --maxWorkers=1`: 331/332 testes, 64/65 arquivos aprovados. ?nica falha: Calendar.test.tsx, caso de chegada/sa?da, excedeu 5000 ms. Reexecu??o isolada do arquivo, sem alterar timeout nem c?digo: 19/19 aprovados. A rodada ampla n?o ? declarada aprovada; instabilidade de tempo permanece registrada. Nenhum arquivo de Calendar foi modificado.

ESLint identificou borderRadius num?rico na p?lula; substitu?do por quintalRadii.pill. Ap?s corre??o, ESLint passou e as 5 stories passaram novamente. Typecheck global, Prettier e diff --check aprovados. E2E my-stays ganhou assertivas de geometria horizontal/sem overflow e de encerramento cancelado; execu??o coordenada ap?s integrar.
