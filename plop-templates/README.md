> Atualização 11/10/2026: nota e catálogo publicados no vault; pendência histórica abaixo encerrada. Resultados finais em [validation](../docs/validation.md).

# Geradores , REQ-TOOL-012 / T11

Status: implementado. Documentação provisória para o Obsidian: o vault é legível,
mas está fora da área gravável desta sessão. Publicar esta nota no vault e
registrar os recursos abaixo em `development/resource-catalog.md` continua pendente.
Não foram encontrados geradores existentes no código ou no catálogo.

## Uso e responsabilidade

```sh
npm run gen:feature -- pets
npm run gen:component -- shared/ui/feedback PetIdCard
npm run gen:component -- features/pets/components/client PetIdCard
npm run gen:component -- widgets/pet-summary/components/server PetSummary
```

No PowerShell, use `npm.cmd` e `npx.cmd`. Sem argumentos, o Plop pergunta os
valores. Com argumentos posicionais, os prompts são ignorados, mas as ações
validam novamente os nomes. Arquivos existentes não são sobrescritos.

`../plopfile.mjs` registra `feature` e `component`. Depende do Plop instalado;
não faz chamadas HTTP nem cria domínios ou comportamentos de produto. Os arquivos
`.hbs` desta pasta definem a anatomia; só pastas com arquivos são geradas.
O loader ESM do Plop exige o export default do registro. O formato CSF do
Storybook exige o meta default da story; componentes e funções usam exports nomeados.

Feature cria apenas `src/features/<nome>/index.ts`, `index.client.ts` e
`index.server.ts`. O índice neutro recebe tipos, schemas e funções puras; o client
reexporta hooks e componentes client, sem diretiva `use client`; o server importa
`server-only`. Todos trazem TSDoc explicando os limites das exportações.

Componente cria `src/<camada>/<Nome>/{<Nome>.tsx,<Nome>.test.tsx,<Nome>.stories.tsx,index.ts}`.
A implementação tem export nomeado, interface de props e TSDoc para preencher
responsabilidade, uso, limites, props e exemplo. A prop inicial `children` aceita
`ReactNode`. Camadas client recebem `use client`; camadas server recebem
`server-only`; shared permanece neutra. O teste lança deliberadamente
`Escreva o teste do criterio (REQ-...) antes de implementar`. Substitua-o por um
teste do requisito antes de implementar o comportamento. A story tem `Padrao` e
`parameters.design.board` vazio: preencha board e estados na entrega do componente.
O índice exporta o componente e seu tipo de props.

## Catálogo provisório de recursos

Todos os recursos abaixo são utilitários de tooling implementados em `naming.mjs`,
consumidos pelo gerador e/ou testes. São puros, sem estado ou efeitos colaterais.
Não substituem validação de dados de produto. A validação usa nomes técnicos ASCII,
sem exigir plural, e não normaliza silenciosamente entradas dos geradores.

| Recurso               | Interface / propósito                                              | Limites                                                                                                  |
| --------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `toPascalCase`        | `(string) => string`, converte palavras e acrônimos                | Vazio produz vazio; acrônimos são normalizados; não valida nomes                                         |
| `toKebabCase`         | `(string) => string`, separa palavras e normaliza separadores      | Vazio produz vazio; não valida nomes                                                                     |
| `assertFeatureName`   | `(string) => void`, valida kebab-case minúsculo                    | Começa por letra; erro em português; singular permitido                                                  |
| `assertComponentName` | `(string) => void`, valida PascalCase                              | Começa por letra maiúscula ASCII; sem separadores                                                        |
| `assertLayerPath`     | `(string) => void`, valida camada relativa a `src`                 | Apenas shared/ui/grupo e features ou widgets/nome/components/client ou server; sem traversal/barra final |
| `componentFiles`      | `(layerPath, name) => string[]`, quatro caminhos relativos ao repo | Valida ambos os argumentos antes de produzir a lista; não escreve arquivos                               |
| `featureFiles`        | `(name) => string[]`, três índices relativos ao repo               | Valida o nome; não cria pastas planejadas nem escreve arquivos                                           |

## Validação e níveis de teste

`templates.test.ts` contém 56 casos unitários/funcionais para as sete funções:
conversões, acrônimos, vazio, nomes válidos, singular, caracteres inválidos,
traversal, formatos de camada e listas exatas de arquivos.

- TDD vermelho: `npx.cmd vitest run --project unit plop-templates` retornou 1,
  por ausência de `naming.mjs`, antes da implementação.
- Verde: mesmo comando retornou 0, com 56 testes aprovados.
- Integração CLI/arquivos: `npm.cmd run gen:feature -- sandbox-check` e
  `npm.cmd run gen:component -- shared/ui/feedback SandboxCheck` retornaram 0,
  sem prompts. Os sete arquivos foram lidos e conferidos: nomes, TSDoc,
  exportações, server-only, índice client sem diretiva e story com board vazio.
- `npx.cmd vitest run --project component src/shared/ui/feedback/SandboxCheck/SandboxCheck.test.tsx`
  retornou 1 com a mensagem exigida, comprovando o teste vermelho do template.
- Todos os arquivos temporários e as pastas que ficaram vazias foram removidos;
  ambos os diretórios de sandbox retornaram `False` em `Test-Path`.
- `npx.cmd eslint plopfile.mjs plop-templates/naming.mjs plop-templates/templates.test.ts`
  e `npm.cmd run typecheck` retornaram 0.

Componente/Testing Library não se aplica ao tooling: não há UI implementada;
o template só inicia o futuro teste do componente. MSW não se aplica: não há HTTP.
E2E/Playwright não se aplica: não há jornada de navegador; a fronteira aplicável
é o CLI com sistema de arquivos, verificada acima.

O Vitest emitiu avisos existentes sobre o futuro configLoader native do Vite
e o plugin vite-tsconfig-paths. Nenhuma configuração de outro agente foi alterada.
Não foi executado `verify` global nesta tarefa isolada; lint direcionado, typecheck
e testes indicados acima são os checks efetivamente executados.
