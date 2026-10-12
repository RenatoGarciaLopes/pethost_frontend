import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { server } from "@/test/msw/server";
import { parseServerEnv } from "@/shared/config/env.server";
import { createBackendClient, forwardedForOf } from "./backendClient";

const env = parseServerEnv({ BACKEND_URL: "http://api.test", BACKEND_API_PREFIX: "/api/v1", NODE_ENV: "test" });

describe("createBackendClient", () => {
  it("REQ-HTTP-010 envia Bearer e X-Forwarded-For para a base da API", async () => {
    let seen: Headers | undefined;
    server.use(
      http.get("http://api.test/api/v1/users/me", ({ request }) => {
        seen = request.headers;
        return HttpResponse.json({ success: true, data: { ok: true } });
      }),
    );

    await createBackendClient({ accessToken: "tok", forwardedFor: "203.0.113.7" }, { env }).request(
      { method: "GET", path: "/users/me" },
      z.object({ ok: z.boolean() }),
    );

    expect(seen?.get("authorization")).toBe("Bearer tok");
    expect(seen?.get("x-forwarded-for")).toBe("203.0.113.7");
  });

  it("REQ-HTTP-010 anônimo não manda Authorization", async () => {
    let seen: Headers | undefined;
    server.use(
      http.post("http://api.test/api/v1/auth/sessions/login", ({ request }) => {
        seen = request.headers;
        return HttpResponse.json({ success: true, data: {} });
      }),
    );

    await createBackendClient({}, { env }).request(
      { method: "POST", path: "/auth/sessions/login", body: {} },
      z.object({}),
    );

    expect(seen?.has("authorization")).toBe(false);
    expect(seen?.has("x-forwarded-for")).toBe(false);
  });
});

describe("forwardedForOf", () => {
  it("REQ-HTTP-010 repassa a cadeia do proxy da frente, ou o X-Real-IP", () => {
    expect(forwardedForOf(new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.2" }))).toBe("198.51.100.1, 10.0.0.2");
    expect(forwardedForOf(new Headers({ "x-real-ip": "198.51.100.9" }))).toBe("198.51.100.9");
    expect(forwardedForOf(new Headers())).toBeUndefined();
  });
});
