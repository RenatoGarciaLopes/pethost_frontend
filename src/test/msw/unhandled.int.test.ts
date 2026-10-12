import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server, takeUnhandledRequests } from "./server";

describe("MSW estrito", () => {
  it("REQ-TOOL-002 rejeita a requisição sem handler e registra método e URL", async () => {
    const url = "http://api.test/api/v1/sem-handler";

    await expect(fetch(url)).rejects.toThrow();

    // Consome o registro que, sem esta linha, reprovaria o teste no afterEach.
    expect(takeUnhandledRequests()).toEqual([expect.stringContaining(`GET ${url}`)]);
  });

  it("REQ-TOOL-002 deixa passar a requisição que tem handler", async () => {
    server.use(http.get("http://api.test/api/v1/ping", () => HttpResponse.json({ ok: true })));

    const response = await fetch("http://api.test/api/v1/ping");

    expect(await response.json()).toEqual({ ok: true });
  });
});
