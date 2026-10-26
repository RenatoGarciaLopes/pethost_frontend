import type { ReactElement } from "react";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, expect, it, vi } from "vitest";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { petKeeperDto } from "@/test/fixtures/pets";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/msw/server";
import NewPetPage from "./page";
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => undefined,
}));
vi.mock("next/headers", async () => {
  const { fakeJwt, nowSeconds } = await import("@/test/fixtures/session");
  return {
    cookies: async () => ({
      get: (name: string) => (name === "pethost_at" ? { value: fakeJwt(nowSeconds() + 600) } : undefined),
    }),
    headers: async () => new Headers(),
  };
});
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ push: vi.fn() }),
}));
afterEach(() => {
  getQueryClient().clear();
  sessionStorage.clear();
});
async function content() {
  server.use(
    http.get("http://api.test/api/v1/users/me", () =>
      HttpResponse.json(apiOk({ ...sessionUserFixture, role: "host" })),
    ),
  );
  // Vitest não executa RSC async no DOM; resolve a ilha de servidor dentro do Suspense antes do render.
  const shell = NewPetPage({ searchParams: Promise.resolve({}) });
  const child = shell.props.children as ReactElement<{ searchParams: Promise<Record<string, string>> }>;
  const resolveContent = child.type as (props: typeof child.props) => Promise<ReactElement>;
  return resolveContent(child.props);
}
it("REQ-HPETS-003 URL direta de cadastro verifica keeper antes de mostrar formulário", async () => {
  server.use(
    http.get("http://api.test/api/v1/pets/me", () =>
      HttpResponse.json(apiFail("PET_KEEPER_NOT_FOUND"), { status: 404 }),
    ),
  );
  renderWithProviders(await content(), { theme: quintalTheme });
  expect(screen.getByText("Os pets da casa entram depois que sua verificação for aprovada.")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
});
it("REQ-HPETS-003/004 aprovado monta formulário com abertura de anfitrião", async () => {
  server.use(
    http.get("http://api.test/api/v1/pets/me", () =>
      HttpResponse.json(apiOk({ keeper: { ...petKeeperDto, type: "host" }, pets: [] })),
    ),
  );
  renderWithProviders(await content(), { theme: quintalTheme });
  // Step and page entrances start transparent; wait for the motion to settle.
  await waitFor(() => expect(screen.getByRole("heading", { name: "Quem mora com você?" })).toBeVisible());
});
it("REQ-HPETS-003 outro erro de preflight relança e não libera formulário", async () => {
  server.use(
    http.get("http://api.test/api/v1/pets/me", () => HttpResponse.json(apiFail("FORBIDDEN"), { status: 403 })),
  );
  await expect(content()).rejects.toMatchObject({ code: "FORBIDDEN" });
});
