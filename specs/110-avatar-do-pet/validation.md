# Validação 110

## Níveis e comportamento

- Unitário/funcional: `PetAvatar.test.tsx` (9 casos) verifica foto, falha da foto, nome acessível, desenho decorativo, id estável apesar de nome/tamanho, quatro pelagens de cão/gato, diferenças entre grupos e aliases do enum. A regra de hash é interna e coberta pelo componente, sem export artificial.
- Funcional de consumidores: `StaySummary.test.tsx` (2 casos) verifica avatar da espécie e nome único no resumo normal e checkout; `PetProfileCard.test.tsx` ajusta busca da imagem decorativa dentro do contêiner oculto. PetList continua verificando foto real e desenho na ausência de foto.
- Integração: suítes existentes de pets, bookings, listing-page e widget booking-pet-profiles, com providers/HTTP simulado. Não equivale a validação contra API real.
- Stories: conjunto, sem foto e foto indisponível, mais stories dos três domínios existentes, no runner Chromium do Storybook.
- E2E: não executado por instrução expressa do brief; CI é responsabilidade do solicitante. Não houve alteração de contrato HTTP nem nova jornada.

## Execuções

1. `npm test -- src/shared/ui/media/PetAvatar src/features/pets src/features/bookings src/features/listing-page src/widgets/booking-pet-profiles`: 412/430 aprovados, 18 falhas; incluía duplicação de nome acessível já corrigida e timeouts sob concorrência.
2. Mesmo comando com `--maxWorkers=2 --testTimeout=60000`: 427/430 aprovados; duas falhas no PetWizard (timeout/cascata) e teste da foto decorativa ainda carregado antes do ajuste. Não declarar essa execução integralmente aprovada.
3. `npm test -- src/features/pets/components/PetProfileCard.test.tsx src/features/pets/components/client/PetWizard.test.tsx --maxWorkers=1 --reporter=verbose`: 15/15 aprovados, incluindo os três casos da execução anterior.
4. `npm test -- src/shared/ui/media/PetAvatar src/features/bookings/components/client/StaySummary.test.tsx --maxWorkers=1`: 11/11 aprovados.
5. `npx vitest run --config vitest.storybook-110.config.ts src/shared/ui/media/PetAvatar src/features/pets src/features/bookings src/features/listing-page`: 21 arquivos, 103 verificações aprovadas. Config temporário permite `server.fs.allow: ["C:/Users/Renato Lopes/Desktop/PetHost"]`, removido após uso. Vite emite aviso de futuro configLoader; Chromium precisou encerrar processo após execução, testes concluídos.
6. `npm run typecheck`: aprovado, inclusive após remover os arquivos temporários. ESLint dos recursos alterados e `git diff --check`: aprovados.
7. Reexecução final de oito arquivos consumidores com `--maxWorkers=1`: 38/39 aprovados, um timeout de 5 segundos no calendário de StayBookingCard. Reexecutado `npm test -- src/features/listing-page/components/client/StayBookingCard.test.tsx --maxWorkers=1 --testTimeout=60000`: 7/7 aprovados. Nenhuma mudança artificial no timeout dos arquivos de teste foi feita.
8. Reexecução final das stories com `--maxWorkers=1`: 21/21 arquivos, 103/103 verificações aprovadas em 73,70 s.

Os casos com falha nas execuções amplas foram aprovados em reexecuções focadas. Não houve uma execução ampla única totalmente verde: resultados e timeouts foram preservados acima, sem tratá-los como falhas de produto corrigidas.

## Evidência visual

Capturas de componentes reais com dados sintéticos em harness Vite temporário, tema e fontes locais do aplicativo; harness removido. Não são páginas autenticadas contra API real. Nenhuma suíte E2E foi executada para produzi-las.

Em `test-results/110/` (artefatos locais ignorados pelo Git):

- `candidatos.png` (1440), `candidatos-1440.png`, `candidatos-390.png`: Fluent, Noto e Quintal dentro do **StayBookingCard real**, substituindo apenas o conteúdo do avatar para comparação.
- `conjunto-{1440,390}.png`: quatro cães, quatro gatos, seis grupos e tamanhos utilizados.
- `quem-vai-{1440,390}.png`: PetPickCards da solicitação.
- `chips-{1440,390}.png`: StayBookingCard do cantinho, incluindo seleção e barra móvel.
- `meus-pets-{1440,390}.png`: PetList com query cache semeado.
- `ficha-{1440,390}.png`: PetProfileCard sem foto.
- `references/`: amostras SVG de Fluent e Noto com licenças para comparação; não entram no bundle de produção. Origem Noto fixada em v2.047; `svg/LICENSE` é Apache 2.0, enquanto a fonte é OFL. Não confundir os dois.

Inspeção visual: sem círculo vazio, desenhos legíveis em chip de 30 px, contorno e paleta da marca, layout em 390 px sem corte de conteúdo.

`StaySummary.test.tsx` é a cobertura funcional explícita dos chips nas duas composições; junto aos testes existentes de reserva, cobre a nova composição interna `petChips` sem criar uma API pública extra.

## Ambiente e limites

Não houve install/ci, push ou PR. Storybook dev tentou gravar configuração global/cache via junction e falhou por acesso negado; o runner storybook-vitest funcionou. Rede do terminal bloqueou GitHub; amostras foram obtidas pelo portal Maestri. O vault compartilhado foi atualizado localmente; suas alterações preexistentes de outras tarefas foram preservadas.
