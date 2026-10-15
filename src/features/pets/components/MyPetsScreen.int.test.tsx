import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, expect, it, vi } from "vitest";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { petDto, petKeeperDto } from "@/test/fixtures/pets";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/msw/server";
import { MyPetsScreen } from "./MyPetsScreen";
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "synthetic" }) }),
  headers: async () => new Headers(),
}));
afterEach(() => getQueryClient().clear());
it("REQ-HPETS-001 título e tile de anfitrião chegam do servidor", async () => {
  server.use(
    http.get("http://api.test/api/v1/pets/me", () =>
      HttpResponse.json(apiOk({ keeper: { ...petKeeperDto, type: "host" }, pets: [petDto()] })),
    ),
  );
  renderWithProviders(await MyPetsScreen({ accountId: "host-screen", role: "host" }));
  expect(screen.getByRole("heading", { level: 1, name: "Pets da casa" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Apresentar um pet da casa" })).toHaveAttribute("href", "/pets/new");
});
it("REQ-HPETS-002 perfil pendente responde com aviso sem montar a lista", async () => {
  server.use(
    http.get("http://api.test/api/v1/pets/me", () =>
      HttpResponse.json(apiFail("PET_KEEPER_NOT_FOUND"), { status: 404 }),
    ),
  );
  renderWithProviders(await MyPetsScreen({ accountId: "pending-screen", role: "host" }));
  expect(screen.getByText("Os pets da casa entram depois que sua verificação for aprovada.")).toBeVisible();
  expect(screen.queryByRole("link", { name: /Apresentar/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Tentar/ })).not.toBeInTheDocument();
});
