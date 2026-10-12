---
spec: 003-http-and-session
status: in-progress
updated: 2026-10-11
area: HTTP
---

# 003 · HTTP, erros e sessão (BFF)

## Contexto

Toda tela fala com a API do mesmo jeito:

- **mesmo envelope** de resposta;
- **mesmo tratamento de erro**;
- **mesma sessão**, num cookie HttpOnly, com refresh rotativo.

Se cada feature resolvesse isso por conta própria, apareceriam bugs de segurança (token no JavaScript, refresh duplo que derruba a sessão) e mensagens de erro inconsistentes. Esta spec entrega a borda única.

## Referências

- **API:** `pethost_backend/docs/modulo-auth.md`. Fatos que mexem no desenho:
  - envelope e erros nas seções 3 e 4;
  - access token de **15 min** e refresh de **30 dias**, opaco e **de uso único** (`GETDEL`; dois refresh simultâneos com o mesmo token **não** podem ambos funcionar);
  - `expiresAt` em Unix segundos;
  - limite de requisições **por usuário ou IP**, com o IP lido do `X-Forwarded-For`.
- **Vault:** `produto/contrato-api.md` (erro da API → frase da PetHost), `development/frontend-architecture.md` (seção "Sessão e BFF").
- **Depende de:** 001.

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-HTTP-001 | O SISTEMA DEVE ler toda resposta da API pelo envelope `{ success, data \| error, timestamp }` e validar `data` com o schema Zod do contrato                                                                                                                                       |
| REQ-HTTP-002 | QUANDO a API responder erro, O SISTEMA DEVE lançar `ApiError` com `status`, `code`, `message`, `fieldErrors` (mapa campo → mensagens, preservando caminhos aninhados como `address.zipCode`), `retryAfterSeconds` (do header `Retry-After`) e `traceId`                           |
| REQ-HTTP-003 | SE o corpo de sucesso não passar no schema, O SISTEMA DEVE lançar `ApiError` com o código `CONTRACT_MISMATCH` e registrar o caminho inválido, sem expor o corpo ao usuário                                                                                                        |
| REQ-HTTP-004 | SE a rede falhar ou exceder o tempo limite (15 s, configurável), O SISTEMA DEVE lançar `ApiError` com o código `NETWORK_ERROR`                                                                                                                                                    |
| REQ-HTTP-005 | O SISTEMA DEVE traduzir os códigos de erro da API para a microcopy de `produto/contrato-api.md` (`getErrorMessage(error, context?)`), com o texto genérico "Deu um problema do nosso lado…" para código desconhecido                                                              |
| REQ-HTTP-006 | O SISTEMA DEVE oferecer `applyFieldErrors(form.setError, error)`, que leva os `fieldErrors` da API aos campos do React Hook Form, incluindo os aninhados                                                                                                                          |
| REQ-HTTP-007 | QUANDO o login, o cadastro, a reativação, o reset de senha ou a troca de conta tiverem sucesso, O BFF DEVE gravar o access token e o refresh token em cookies `HttpOnly`, `Secure` (fora de `localhost`) e `SameSite=Lax`, e devolver ao navegador **só** o `user`, sem os tokens |
| REQ-HTTP-008 | O cookie do access token DEVE expirar em `expiresAt`; o do refresh, em 30 dias (configurável), com `Path=/api` (só o BFF o recebe, nunca as páginas; o proxy precisa dele para o REQ-HTTP-011)                                                                                    |
| REQ-HTTP-009 | O BFF DEVE repassar ao backend apenas as rotas da lista permitida (método + padrão); o que não estiver nela DEVE responder 404 no envelope. Papéis ficam com a API (autoridade única; o OpenAPI não descreve segurança por rota). Rotas que devolvem tokens nunca entram na lista |
| REQ-HTTP-010 | QUANDO o BFF repassar uma requisição, ELE DEVE adicionar `Authorization: Bearer` a partir do cookie, repassar `X-Forwarded-For` com o IP do cliente e devolver status, envelope e `Retry-After` sem alterar                                                                       |
| REQ-HTTP-011 | QUANDO o access token estiver vencido ou a menos de 60 s de vencer, O BFF DEVE renovar **uma única vez por refresh token**, mesmo com várias requisições simultâneas (execução única por chave), regravar os cookies e repetir a requisição original uma vez                      |
| REQ-HTTP-012 | SE o refresh falhar (401), O BFF DEVE apagar os cookies de sessão e responder 401 `SESSION_EXPIRED`; o navegador DEVE limpar o cache do Query e levar ao login com `next` de volta                                                                                                |
| REQ-HTTP-013 | QUANDO uma requisição que altera dados (POST, PUT, PATCH, DELETE) chegar ao BFF, ELE DEVE exigir a `Origin` igual à do app e o cabeçalho `X-PetHost-Request: 1`, e responder 403 `CSRF_REJECTED` se faltar algum                                                                  |
| REQ-HTTP-014 | O BFF DEVE repassar `multipart/form-data` em streaming, sem carregar o arquivo inteiro na memória, respeitando os limites da API (5 MB por foto, 8 MB por corpo de pet, 24 MB por envio de documentos)                                                                            |
| REQ-HTTP-015 | O SISTEMA DEVE oferecer `getSession()` no servidor (memorizado por requisição com `cache` do React): conta atual (`user` com `role`) ou `null`, sem decodificar o JWT como fonte da verdade                                                                                       |
| REQ-HTTP-016 | SE um Server Component encontrar a sessão vencida, O SISTEMA DEVE redirecionar para `/api/auth/sessions/refresh?next=<rota>`, que renova e volta (Server Components não gravam cookie)                                                                                            |
| REQ-HTTP-017 | QUANDO houver logout ou troca de conta, O SISTEMA DEVE chamar a API, apagar ou regravar os cookies e limpar todo o cache do TanStack Query no navegador                                                                                                                           |
| REQ-HTTP-018 | O SISTEMA DEVE criar um QueryClient novo por requisição no servidor e um estável no navegador, com as query keys contendo o id da conta                                                                                                                                           |
| REQ-HTTP-019 | Nenhum token, documento ou URL assinada DEVE ser gravado em `localStorage`, `sessionStorage`, store Zustand ou log                                                                                                                                                                |

## Fora do escopo

- **Telas:** login e as demais telas usam esta base (spec 010 em diante).
- **Coordenação de refresh entre várias instâncias do Next:** fica registrada como limite conhecido. Com uma instância, a execução única em memória resolve. Com várias, o refresh concorrente perde a corrida e o cliente reautentica pelo REQ-HTTP-012, o que precisa de uma trava distribuída (Redis) antes de escalar horizontalmente.
