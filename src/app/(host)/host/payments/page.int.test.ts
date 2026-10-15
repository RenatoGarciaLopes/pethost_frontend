import type { ReactElement } from "react";
import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import HostPaymentsPage, { metadata } from "./page";
vi.mock("next/headers", async () => {
  const { fakeJwt, nowSeconds } = await import("@/test/fixtures/session");
  return {
    cookies: async () => ({
      get: (name: string) => (name === "pethost_at" ? { value: fakeJwt(nowSeconds() + 600) } : undefined),
    }),
    headers: async () => new Headers(),
  };
});
// O requireRole espera a requisição (connection()) antes de ler a sessão; fora do Next, a espera é imediata.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
async function resolveContent() {
  const content = HostPaymentsPage().props.children as ReactElement;
  return (content.type as () => Promise<ReactElement>)();
}
it("REQ-PAYOUT-001 metadata privada tem título próprio", () => {
  expect(metadata).toEqual({ title: "Como você recebe · PetHost", robots: { index: false, follow: false } });
});
it("REQ-PAYOUT-001 conta anfitriã chega ao RSC com id da sessão", async () => {
  server.use(
    http.get("http://api.test/api/v1/users/me", () =>
      HttpResponse.json(apiOk({ ...sessionUserFixture, role: "host" })),
    ),
  );
  const result = await resolveContent();
  expect(result.props).toMatchObject({ accountId: sessionUserFixture.id });
});
it.each([
  ["owner", "/"],
  ["admin", "/admin/host-applications"],
])("REQ-PAYOUT-001 papel %s não acessa pagamentos de host", async (role, home) => {
  server.use(
    http.get("http://api.test/api/v1/users/me", () => HttpResponse.json(apiOk({ ...sessionUserFixture, role }))),
  );
  await expect(resolveContent()).rejects.toThrow(`redirect:${home}`);
});
