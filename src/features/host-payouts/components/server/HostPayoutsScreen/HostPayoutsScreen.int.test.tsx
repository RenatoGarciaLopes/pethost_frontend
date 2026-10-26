import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, expect, it, vi } from "vitest";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { payoutAccountDto } from "@/test/fixtures/payouts";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { server } from "@/test/msw/server";
import { HostPayoutsScreen } from "./HostPayoutsScreen";
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "synthetic-access" }) }),
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
afterEach(() => getQueryClient().clear());
it("REQ-PAYOUT-001 tela hidratada já mostra situação sem GET extra no BFF", async () => {
  server.use(
    http.get("http://api.test/api/v1/hosts/me/stripe-account", () =>
      HttpResponse.json(apiOk(payoutAccountDto({ status: "under_review" }))),
    ),
  );
  renderWithProviders(await HostPayoutsScreen({ accountId: "host" }), { theme: quintalTheme });
  expect(screen.getByRole("heading", { name: "Como você recebe", level: 1 })).toBeVisible();
  expect(screen.getByText("O Stripe está conferindo seus dados. Leva até 2 dias úteis.")).toBeVisible();
});
it("REQ-PAYOUT-002 perfil ausente chega hidratado como orientação", async () => {
  server.use(
    http.get("http://api.test/api/v1/hosts/me/stripe-account", () =>
      HttpResponse.json(apiFail("HOST_NOT_FOUND"), { status: 404 }),
    ),
  );
  renderWithProviders(await HostPayoutsScreen({ accountId: "pending" }), { theme: quintalTheme });
  expect(screen.getByRole("link", { name: "Ver minha verificação" })).toHaveAttribute("href", "/host/application");
  expect(screen.queryByRole("button", { name: "Cadastrar como eu recebo" })).not.toBeInTheDocument();
});
