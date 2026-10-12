import { http, HttpResponse, delay } from "msw";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { server } from "@/test/msw/server";
import { createFetchTransport } from "./fetchTransport";

const base = "http://api.test/api/v1";
const transport = createFetchTransport({ baseUrl: base, timeoutMs: 200 });
const userSchema = z.object({ id: z.string(), email: z.string().email() });

describe("fetchTransport com rede simulada (MSW)", () => {
  it("REQ-HTTP-001 sucesso válido", async () => {
    server.use(
      http.get(`${base}/users/me`, () =>
        HttpResponse.json({ success: true, data: { id: "1", email: "a@b.co" }, timestamp: "x" }),
      ),
    );

    await expect(transport.request({ method: "GET", path: "/users/me" }, userSchema)).resolves.toEqual({
      id: "1",
      email: "a@b.co",
    });
  });

  it("REQ-HTTP-002 400 com detalhes aninhados", async () => {
    server.use(
      http.post(`${base}/users/register`, () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Validation failed",
              details: [{ field: "address.zipCode", messages: ["Zip code is invalid."] }],
            },
          },
          { status: 400 },
        ),
      ),
    );

    await expect(
      transport.request({ method: "POST", path: "/users/register", body: {} }, userSchema),
    ).rejects.toMatchObject({ status: 400, fieldErrors: { "address.zipCode": ["Zip code is invalid."] } });
  });

  it("REQ-HTTP-002 429 com Retry-After", async () => {
    server.use(
      http.post(`${base}/auth/sessions/login`, () =>
        HttpResponse.json(
          { success: false, error: { code: "TOO_MANY_REQUESTS", message: "x" } },
          { status: 429, headers: { "Retry-After": "30" } },
        ),
      ),
    );

    await expect(
      transport.request({ method: "POST", path: "/auth/sessions/login", body: {} }, userSchema),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS", retryAfterSeconds: 30 });
  });

  it("REQ-HTTP-002 500 com traceId", async () => {
    server.use(
      http.get(`${base}/users/me`, () =>
        HttpResponse.json(
          { success: false, error: { code: "UNEXPECTED_ERROR", message: "x", details: { traceId: "0HN7" } } },
          { status: 500 },
        ),
      ),
    );

    await expect(transport.request({ method: "GET", path: "/users/me" }, userSchema)).rejects.toMatchObject({
      status: 500,
      traceId: "0HN7",
    });
  });

  it("REQ-HTTP-003 corpo inválido", async () => {
    server.use(http.get(`${base}/users/me`, () => HttpResponse.json({ success: true, data: { id: "1", email: 3 } })));

    await expect(transport.request({ method: "GET", path: "/users/me" }, userSchema)).rejects.toMatchObject({
      code: "CONTRACT_MISMATCH",
      invalidPaths: ["data.email"],
    });
  });

  it("REQ-HTTP-004 timeout", async () => {
    server.use(
      http.get(`${base}/users/me`, async () => {
        await delay(1_000);
        return HttpResponse.json({ success: true, data: {} });
      }),
    );

    await expect(transport.request({ method: "GET", path: "/users/me" }, userSchema)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
  });

  it("REQ-HTTP-004 rede caída", async () => {
    server.use(http.get(`${base}/users/me`, () => HttpResponse.error()));

    await expect(transport.request({ method: "GET", path: "/users/me" }, userSchema)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
  });
});
