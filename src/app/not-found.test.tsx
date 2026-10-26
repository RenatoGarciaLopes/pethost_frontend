import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { connection } from "next/server";
import { Suspense } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { apiOk, fakeJwt, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import NotFound from "./not-found";
const request = vi.hoisted(() => ({ access: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "pethost_at" && request.access ? { value: request.access } : undefined),
  }),
  headers: async () => new Headers(),
}));
vi.mock("next/server", () => ({ connection: vi.fn(async () => undefined) }));
beforeEach(() => {
  request.access = undefined;
  vi.mocked(connection).mockClear();
});
it("REQ-SHELL-014 página não lê sessão fora de Suspense e fallback aponta para raiz", () => {
  const page = NotFound();
  expect(page.type).toBe(Suspense);
  expect(connection).not.toHaveBeenCalled();
  renderWithProviders(page.props.fallback, { theme: quintalTheme });
  expect(screen.getByRole("heading", { level: 1, name: "Esse cantinho não existe" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Voltar para o início" })).toHaveAttribute("href", "/");
});
it.each([
  [undefined, "/"],
  ["owner", "/"],
  ["host", "/host"],
  ["admin", "/admin/host-applications"],
] as const)("REQ-SHELL-014 conta %s volta para %s sem mudar a autorização", async (role, home) => {
  if (role) request.access = fakeJwt(Math.floor(Date.now() / 1000) + 900);
  let reads = 0;
  server.use(
    http.get("http://api.test/api/v1/users/me", () => {
      expect(connection).toHaveBeenCalledOnce();
      reads++;
      return HttpResponse.json(apiOk({ ...sessionUserFixture, role }));
    }),
  );
  const page = NotFound();
  const content = await page.props.children.type(page.props.children.props);
  const view = content.type(content.props);
  const action = view.props.children.props.action;
  expect(Object.values(action.props).some((value) => typeof value === "function")).toBe(false);
  renderWithProviders(content, { theme: quintalTheme });
  expect(screen.getByRole("heading", { name: "Esse cantinho não existe" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Voltar para o início" })).toHaveAttribute("href", home);
  expect(reads).toBe(role ? 1 : 0);
});
it("REQ-SHELL-014 API indisponível mantém o 404 com saída neutra para raiz", async () => {
  request.access = fakeJwt(Math.floor(Date.now() / 1000) + 900);
  server.use(http.get("http://api.test/api/v1/users/me", () => HttpResponse.error()));
  const page = NotFound();
  const content = await page.props.children.type(page.props.children.props);
  renderWithProviders(content, { theme: quintalTheme });
  expect(screen.getByRole("link", { name: "Voltar para o início" })).toHaveAttribute("href", "/");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
