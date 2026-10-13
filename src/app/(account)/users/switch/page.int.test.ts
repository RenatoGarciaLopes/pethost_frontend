import { http, HttpResponse } from "msw";
import type { ReactElement, ReactNode } from "react";
import type { SearchParams } from "@/shared/lib/url/searchParams";
import { expect, it, vi } from "vitest";
import { apiOk, fakeJwt, nowSeconds, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import AccountSwitchPage from "./page";

const requestTime = vi.hoisted(() => ({ connection: vi.fn(async () => {}) }));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: requestTime.connection,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "pethost_at" ? { value: fakeJwt(nowSeconds() + 600) } : undefined),
  }),
  headers: async () => new Headers(),
}));

it("REQ-SWITCH-001 guarda consulta a sessão em tempo de requisição e redireciona admin", async () => {
  server.use(
    http.get("http://api.test/api/v1/users/me", () =>
      HttpResponse.json(apiOk({ ...sessionUserFixture, role: "admin" })),
    ),
  );
  const page = AccountSwitchPage({ searchParams: Promise.resolve({}) });
  const child = page.props.children as ReactElement<{ searchParams: Promise<SearchParams> }>;
  const resolve = child.type as (props: typeof child.props) => Promise<ReactNode>;
  await expect(resolve(child.props)).rejects.toMatchObject({
    digest: expect.stringContaining("/admin/host-applications"),
  });
  expect(requestTime.connection).toHaveBeenCalledOnce();
});
