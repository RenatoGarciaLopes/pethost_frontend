import type { IStripeConnectInitParams } from "@stripe/connect-js";
import { act, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { payoutAccountDto } from "@/test/fixtures/payouts";
import { server } from "@/test/msw/server";
import { payoutQueries } from "../../../api/queries";
import { toPayoutAccount } from "../../../api/mappers";
import { stripeAccountSchema } from "../../../api/contracts";
import { HostPayouts } from "./HostPayouts";
const boundary = vi.hoisted(() => ({
  query: "",
  replace: vi.fn(),
  options: undefined as IStripeConnectInitParams | undefined,
  logout: vi.fn(async () => undefined),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: boundary.replace }),
  useSearchParams: () => new URLSearchParams(boundary.query),
}));
vi.mock("@stripe/connect-js/pure", () => ({
  loadConnectAndInitialize: (options: IStripeConnectInitParams) => {
    boundary.options = options;
    return { create: vi.fn(), update: vi.fn(), logout: boundary.logout };
  },
}));
vi.mock("@stripe/react-connect-js", () => ({
  ConnectComponentsProvider: ({ children }: { children: ReactNode }) => children,
  ConnectAccountOnboarding: ({ onExit, onLoadError }: { onExit: () => void; onLoadError: () => void }) => (
    <>
      <button onClick={onExit}>Sair do Stripe fake</button>
      <button onClick={onLoadError}>Falhar Stripe fake</button>
    </>
  ),
}));
beforeEach(() => {
  boundary.query = "";
  boundary.replace.mockClear();
  localStorage.clear();
  sessionStorage.clear();
});
function setup(status = "not_started") {
  const client = createTestQueryClient();
  client.setQueryData(
    payoutQueries.account("host").queryKey,
    toPayoutAccount(stripeAccountSchema.parse(payoutAccountDto({ status }))),
  );
  return renderWithProviders(<HostPayouts accountId="host" />, { theme: quintalTheme, queryClient: client });
}
function respond() {
  let sessions = 0;
  let syncs = 0;
  server.use(
    http.post("*/api/hosts/me/stripe-account/onboarding-session", () =>
      HttpResponse.json(
        apiOk({
          clientSecret: `synthetic-secret-${++sessions}`,
          publishableKey: "pk_test_synthetic",
          expiresAt: 2000000000,
          account: payoutAccountDto({ status: "in_progress" }),
        }),
      ),
    ),
    http.post("*/api/hosts/me/stripe-account/synchronization", () => {
      syncs++;
      return HttpResponse.json(apiOk(payoutAccountDto({ status: "enabled", payoutsEnabled: true })));
    }),
  );
  return { sessions: () => sessions, syncs: () => syncs };
}
it("REQ-PAYOUT-004/006/007 só abre por ação, foca região, renova segredo e sincroniza onExit", async () => {
  const calls = respond();
  const { user, queryClient } = setup();
  expect(calls.sessions()).toBe(0);
  await user.click(screen.getByRole("button", { name: "Cadastrar como eu recebo" }));
  expect(screen.getByRole("heading", { name: "Cadastro de recebimento" })).toHaveFocus();
  await screen.findByRole("button", { name: "Sair do Stripe fake" });
  await act(async () => {
    expect(await boundary.options!.fetchClientSecret()).toBe("synthetic-secret-1");
    expect(await boundary.options!.fetchClientSecret()).toBe("synthetic-secret-2");
  });
  await user.click(screen.getByRole("button", { name: "Sair do Stripe fake" }));
  expect(await screen.findByText("Recebimento conectado ✓")).toBeVisible();
  expect(calls.syncs()).toBe(1);
  expect(
    JSON.stringify(
      queryClient
        .getQueryCache()
        .getAll()
        .map((query) => query.state.data),
    ),
  ).not.toContain("synthetic-secret");
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
});
it("REQ-PAYOUT-010 erro do script oferece cadastro hospedado", async () => {
  respond();
  const { user } = setup();
  await user.click(screen.getByRole("button", { name: "Cadastrar como eu recebo" }));
  await user.click(await screen.findByRole("button", { name: "Falhar Stripe fake" }));
  expect(screen.getByRole("button", { name: "Abrir o cadastro no site do Stripe" })).toBeVisible();
});
it.each(["retorno", "renovar"])("REQ-PAYOUT-011 retorno %s sincroniza uma vez e remove só stripe", async (value) => {
  boundary.query = `stripe=${value}&tab=recebimento`;
  let calls = 0;
  server.use(
    http.post("*/api/hosts/me/stripe-account/synchronization", () => {
      calls++;
      return HttpResponse.json(apiOk(payoutAccountDto({ status: "in_progress" })));
    }),
  );
  const { rerender } = setup("in_progress");
  await waitFor(() => expect(calls).toBe(1));
  expect(boundary.replace).toHaveBeenCalledWith("/host/payments?tab=recebimento", { scroll: false });
  rerender(<HostPayouts accountId="host" />);
  expect(calls).toBe(1);
  if (value === "renovar")
    expect(await screen.findByText("Vamos continuar seu cadastro de recebimento.")).toBeVisible();
});
it("REQ-PAYOUT-012 erro 503 na sessão permite tentar de novo e nunca mostra inglês", async () => {
  let calls = 0;
  server.use(
    http.post("*/api/hosts/me/stripe-account/onboarding-session", () => {
      calls++;
      return HttpResponse.json(apiFail("HOST_STRIPE_UNAVAILABLE", "raw English message"), { status: 503 });
    }),
  );
  const { user } = setup();
  await user.click(screen.getByRole("button", { name: "Cadastrar como eu recebo" }));
  expect(await screen.findByText("O Stripe não respondeu agora. Tenta de novo em alguns minutos.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
  await waitFor(() => expect(calls).toBe(2));
  expect(screen.queryByText("raw English message")).not.toBeInTheDocument();
});
it("REQ-PAYOUT-012 recusa da API remove ações de cadastro", async () => {
  server.use(
    http.post("*/api/hosts/me/stripe-account/onboarding-session", () =>
      HttpResponse.json(apiFail("HOST_STRIPE_ACCOUNT_REJECTED"), { status: 422 }),
    ),
  );
  const { user } = setup();
  await user.click(screen.getByRole("button", { name: "Cadastrar como eu recebo" }));
  expect(
    await screen.findByText(
      "O Stripe não aprovou o recebimento dessa conta. Fala com a gente pra entender o que aconteceu.",
    ),
  ).toBeVisible();
  expect(screen.queryByRole("button", { name: "Cadastrar como eu recebo" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Abrir o cadastro no site do Stripe" })).not.toBeInTheDocument();
});
