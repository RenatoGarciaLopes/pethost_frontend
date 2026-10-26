# Upload direto e fotos privadas do chat

Implementado em 29/10/2026. Contrato backend: `pethost_backend/docs/upload-direto.md` e `docs/upload-reliability.md` no repositório irmão.

## Recursos e reutilização

| Recurso                                                       | Caminho real                                                                                                                                                                            | Interface e consumidores                                                                                                                                                                   |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stageDirectUpload`, `uploadDirect`, `confirmDocumentUploads` | `src/shared/api/client/uploadDirect.ts`                                                                                                                                                 | Metadados ao BFF, File por PUT ao bucket e confirmação JSON. Transporte `HttpTransport` opcional; schemas gerados estendidos para restrições do cliente e transformação do resultado.      |
| Contratos uploads/conversas                                   | `openapi/pethost.v1.json`; `src/shared/api/generated/{uploads,conversations}/`                                                                                                          | Exportados da API de teste real pelo `OpenApiErrorCodesTests` existente, depois gerados por Orval. Sem editar arquivos gerados à mão.                                                      |
| `bffRoutes` / `deniedRoutes`                                  | `src/shared/api/server/bffRoutes.ts`                                                                                                                                                    | Permite request/confirm/lote e renovação da foto. Nega antigos uploads binários, preservando DELETE de foto e ordenação.                                                                   |
| `uploadErrorCopy` e catálogo                                  | `src/shared/api/errors/copy/uploadErrorCopy.ts`; `errorCopy.ts`                                                                                                                         | Traduz erros de upload e recusa direta do bucket. Códigos antigos de validação de URL do chat removidos após a atualização do contrato.                                                    |
| Clientes de features                                          | `src/features/account/api/client/profileGateway.ts`; `src/features/{pets,host-listings,host-applications}/api/client/`; `src/features/conversations/api/client/conversations.client.ts` | Preservam suas interfaces públicas e schemas de retorno. Avatares, fotos de pets/cantinhos/chat e documentos usam o mesmo recurso shared. Helper multipart privado de listings removido.   |
| `ConversationMessage` / `toMessage`                           | `src/features/conversations/types.ts`; `api/mappers.ts`                                                                                                                                 | Preservam `imageUrlExpiresAt` (Unix segundos; ausente/null nas fotos antigas).                                                                                                             |
| `MessagePhoto` / `MessageThread` / copy                       | `src/features/conversations/components/client/MessageThread/`; `lib/conversationsCopy.ts`                                                                                               | Renderização e renovação privada; uso interno pelo thread, sem API nova entre features.                                                                                                    |
| `directUploadHandlers`, `resetDirectUploads`                  | `e2e/support/handlers/directUploads.mjs`                                                                                                                                                | Adaptador de protocolo sintético reutilizado pelo backend mock e pelo setup MSW em `src/test/`. Estado é apagado entre testes. Não representa validação/permissão .NET nem um bucket real. |

## Uso e comportamento

```ts
await uploadDirect(file, { purpose: "pet-photo", resourceId: petId }, petDtoSchema);
```

`uploadDirect(file, target, resultSchema, transport?, caption?)` devolve o resultado validado/transformado da confirmação. O ticket é conferido contra finalidade, tamanho e tipo do arquivo. O PUT usa exclusivamente headers assinados, `credentials: omit`, `redirect: error` e o File como corpo; não leva cookie, Bearer nem header CSRF do BFF.

Uma confirmação com erro de rede, 5xx ou conflito pode ser repetida até duas vezes, sempre com o mesmo ID. Isso não pede outro ticket nem faz outro PUT. Erros permanentes não repetem. Request e confirmação podem renovar a sessão uma vez por `withSessionRetry`. Se todas as tentativas falharem, a UI mantém seu fluxo de erro existente; não foi criado armazenamento persistente de tickets no navegador. MIME ausente pode ser inferido da extensão JPEG/PNG/WebP; a validação dos bytes pertence ao backend.

Documentos: `stageDirectUpload` envia cada arquivo sem aplicá-lo; `confirmDocumentUploads(ids, schema, transport?)` confirma as vagas selecionadas juntas. Preserva a atomicidade anterior do formulário, com erro da vaga informado pelo backend. Nenhum novo provider/store ou biblioteca de upload foi criado.

`MessagePhoto` usa o mesmo GET autorizado disponibilizado pela API para renovar dez segundos antes do vencimento, ao voltar à aba com link vencido e uma vez automaticamente após falha de imagem. Falha persistente oferece botão explícito, sem loop de requisições. Desmontagem cancela request/timer/listener; assinaturas recebidas pelo polling preservam a imagem atual até sua renovação. URLs públicas antigas continuam sem timer. O contrato de exibição e as bordas da foto permanecem os existentes.

Lint, typecheck e formatacao excluem `.claude/worktrees`, pois sao checkouts locais independentes e seus arquivos gerados nao pertencem a este projeto.

## Mocks e limites

O adaptador MSW oferece ticket, PUT e confirmação e reaproveita os handlers sintéticos de recursos via sua interface multipart anterior. Esses handlers são fixtures de negócio de teste, não chamadas multipart feitas pelo frontend de produção. Assim testes existentes continuam verificando persistência, erros de campo e sessão; `uploadDirect.int.test.ts` testa explicitamente o protocolo novo e a ausência de credenciais no bucket. O adaptador não promete validar propriedade/tamanho/conteúdo na emissão do ticket: isso é coberto pelos testes reais do backend.

Em produção, o navegador precisa alcançar o endpoint HTTPS do bucket e passar pelo CORS configurado para `https://pethost.cfd`. As credenciais permanecem no backend. Esta entrega não configura DNS, proxy, `.env` de produção ou migração das fotos antigas.

## Validação

Unitários: contrato/copy/mapeamento/rotas BFF. Integração HTTP: transporte direto, erros, confirmação ambígua, clientes das seis finalidades e documentos em lote. Integração DOM: expiração, foco e falhas de fotos do chat, além dos componentes consumidores existentes. A API real é validada separadamente com PostgreSQL/RustFS nos testes backend. Jornadas Playwright usam mock local, sem afirmar integração completa com produção.

Validação: 714 testes aprovados em 26 arquivos na suíte direcionada; repetição final de transporte, fotos privadas e chips com 15 testes aprovados, incluindo a assinatura rotativa. Typecheck aprovado. Quatro jornadas Playwright aprovadas (avatar e chips, desktop/mobile), com backend simulado. O build webpack compilou, mas falhou no prerender de `/_global-error`: o loader acessa `palette.quintal` fora do provider. Build de produção não aprovado; sem deploy nesta entrega. Nenhuma story artificial foi criada para o transporte HTTP.
