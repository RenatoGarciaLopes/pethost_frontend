import { setupServer } from "msw/node";

/**
 * Servidor MSW compartilhado pelos testes Vitest.
 *
 * Começa sem handlers: cada teste registra os seus com `server.use(...)`, e o setup
 * reseta tudo após cada teste. Requisição sem handler é registrada aqui e reprova o
 * teste no `afterEach` (REQ-TOOL-002), configurado em `src/test/setup/vitest.setup.ts`.
 *
 * @example
 * server.use(http.get("http://api.test/api/v1/pets/me", () => HttpResponse.json(body)));
 */
export const server = setupServer();

const unhandledRequests: string[] = [];

/** Mensagem padronizada para requisição sem handler. */
export function formatUnhandledRequestMessage(method: string, url: string): string {
  return `[MSW] Requisição sem handler: ${method} ${url}. Registre um handler com server.use(...) no teste.`;
}

/** Usado pelo setup: guarda a requisição sem handler. */
export function recordUnhandledRequest(method: string, url: string): void {
  unhandledRequests.push(formatUnhandledRequestMessage(method, url));
}

/**
 * Devolve e esvazia as requisições sem handler registradas.
 * O setup chama no `afterEach`; um teste que **espera** uma requisição sem handler
 * também pode chamar para consumir o registro e verificar a mensagem.
 */
export function takeUnhandledRequests(): string[] {
  return unhandledRequests.splice(0, unhandledRequests.length);
}
