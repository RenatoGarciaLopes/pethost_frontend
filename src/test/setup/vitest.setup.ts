import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { recordUnhandledRequest, server, takeUnhandledRequests } from "../msw/server";

/**
 * Setup comum dos projetos Vitest (spec 001).
 *
 * - MSW estrito: requisição sem handler é rejeitada e reprova o teste com método e URL (REQ-TOOL-002).
 * - Handlers e DOM limpos depois de cada teste para isolamento.
 */
beforeAll(() => {
  server.listen({
    onUnhandledRequest(request, print) {
      recordUnhandledRequest(request.method, request.url);
      print.error();
    },
  });
});

afterEach(async () => {
  server.resetHandlers();
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
  const unhandled = takeUnhandledRequests();
  if (unhandled.length > 0) {
    throw new Error(unhandled.join("\n"));
  }
});

afterAll(() => {
  server.close();
});
