import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { server } from "@/test/msw/server";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { createBffClient } from "./bffClient";

const BASE = "http://localhost:3000/api";

describe("bffClient", () => {
  it("REQ-HTTP-013 chama o BFF com o cabeçalho do app e lê o envelope", async () => {
    let csrf: string | null = null;
    server.use(
      http.post(`${BASE}/pets`, ({ request }) => {
        csrf = request.headers.get("x-pethost-request");
        return HttpResponse.json(apiOk({ id: "p1" }), { status: 201 });
      }),
    );

    const pet = await createBffClient({ baseUrl: BASE }).request(
      { method: "POST", path: "/pets", body: { name: "Paçoca" } },
      z.object({ id: z.string() }),
    );

    expect(pet).toEqual({ id: "p1" });
    expect(csrf).toBe("1");
  });

  it("REQ-HTTP-012 SESSION_EXPIRED avisa a sessão e ainda rejeita para quem chamou", async () => {
    server.use(http.get(`${BASE}/pets/me`, () => HttpResponse.json(apiFail("SESSION_EXPIRED"), { status: 401 })));
    const onExpired = vi.fn();

    await expect(
      createBffClient({ baseUrl: BASE, onSessionExpired: onExpired }).request(
        { method: "GET", path: "/pets/me" },
        z.array(z.unknown()),
      ),
    ).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("REQ-HTTP-012 outros erros não derrubam a sessão", async () => {
    server.use(http.get(`${BASE}/pets/me`, () => HttpResponse.json(apiFail("FORBIDDEN"), { status: 403 })));
    const onExpired = vi.fn();

    await expect(
      createBffClient({ baseUrl: BASE, onSessionExpired: onExpired }).request(
        { method: "GET", path: "/pets/me" },
        z.unknown(),
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(onExpired).not.toHaveBeenCalled();
  });
});
