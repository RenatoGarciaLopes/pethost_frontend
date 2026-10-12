import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError } from "../errors/ApiError";
import { buildUrl, createFetchTransport } from "./fetchTransport";

const ok = () =>
  new Response(JSON.stringify({ success: true, data: { ok: true } }), {
    headers: { "content-type": "application/json" },
  });
const schema = z.object({ ok: z.boolean() });

describe("buildUrl", () => {
  it("REQ-HTTP-001 junta base, caminho e query sem barras duplicadas e sem vazios", () => {
    expect(buildUrl("http://api.test/api/v1/", "/hosts", { city: "Maringá", page: 2, empty: undefined })).toBe(
      "http://api.test/api/v1/hosts?city=Maring%C3%A1&page=2",
    );
    expect(buildUrl("/api", "users/me")).toBe("/api/users/me");
  });

  it("REQ-HTTP-001 repete a chave para listas", () => {
    expect(buildUrl("/api", "/hosts", { species: ["dog", "cat"] })).toBe("/api/hosts?species=dog&species=cat");
  });
});

describe("createFetchTransport", () => {
  it("REQ-HTTP-001 envia JSON com cabeçalhos padrão e da chamada", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(ok());
    const transport = createFetchTransport({
      baseUrl: "http://api.test",
      fetch: fetchFn,
      headers: async () => ({ authorization: "Bearer t" }),
    });

    await expect(
      transport.request({ method: "POST", path: "/x", body: { a: 1 }, headers: { "x-extra": "1" } }, schema),
    ).resolves.toEqual({ ok: true });

    const [url, init] = fetchFn.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(url).toBe("http://api.test/x");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe('{"a":1}');
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("authorization")).toBe("Bearer t");
    expect(headers.get("x-extra")).toBe("1");
  });

  it("REQ-HTTP-014 repassa FormData sem forçar content-type (o boundary vem do fetch)", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(ok());
    const form = new FormData();
    form.set("photo", new Blob(["x"]), "a.jpg");

    await createFetchTransport({ baseUrl: "/api", fetch: fetchFn }).request(
      { method: "POST", path: "/pets", body: form },
      schema,
    );

    const init = fetchFn.mock.calls[0]![1];
    expect(init?.body).toBe(form);
    expect(new Headers(init?.headers).has("content-type")).toBe(false);
  });

  it("REQ-HTTP-004 falha de rede vira NETWORK_ERROR", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      createFetchTransport({ baseUrl: "/api", fetch: fetchFn }).request({ method: "GET", path: "/x" }, schema),
    ).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
  });

  it("REQ-HTTP-004 tempo limite vira NETWORK_ERROR", async () => {
    const fetchFn = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          if (init?.signal?.aborted) reject(init.signal.reason);
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        }),
    );

    const error = await createFetchTransport({ baseUrl: "/api", fetch: fetchFn, timeoutMs: 10 })
      .request({ method: "GET", path: "/slow" }, schema)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: "NETWORK_ERROR" });
  });

  it("REQ-HTTP-004 cancelamento de quem chamou não vira erro de rede (o TanStack Query cancela)", async () => {
    const controller = new AbortController();
    const fetchFn = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          if (init?.signal?.aborted) reject(init.signal.reason);
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        }),
    );
    const pending = createFetchTransport({ baseUrl: "/api", fetch: fetchFn }).request(
      { method: "GET", path: "/x", signal: controller.signal },
      schema,
    );

    controller.abort();

    await expect(pending).rejects.not.toBeInstanceOf(ApiError);
  });
});
