import type { IStripeConnectInitParams } from "@stripe/connect-js";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { payoutAccountDto } from "@/test/fixtures/payouts";
import { onboardingSessionSchema } from "../../../api/contracts";
import { EmbeddedOnboarding } from "./EmbeddedOnboarding";
const sdk = vi.hoisted(() => ({
  options: undefined as IStripeConnectInitParams | undefined,
  logout: vi.fn(async () => undefined),
}));
vi.mock("@stripe/connect-js/pure", () => ({
  loadConnectAndInitialize: (options: IStripeConnectInitParams) => {
    sdk.options = options;
    return { create: vi.fn(), update: vi.fn(), logout: sdk.logout };
  },
}));
vi.mock("@stripe/react-connect-js", () => ({
  ConnectComponentsProvider: ({ children }: { children: ReactNode }) => children,
  ConnectAccountOnboarding: ({ onExit, onLoadError }: { onExit: () => void; onLoadError: () => void }) => (
    <>
      <button onClick={onExit}>Sair do cadastro fake</button>
      <button onClick={onLoadError}>Falhar script fake</button>
    </>
  ),
}));
it("REQ-PAYOUT-004/005/006 segredo inicial é consumido uma vez, renovações são frescas e SDK usa pt-BR/Appearance", async () => {
  let calls = 0;
  const createSession = vi.fn(async () =>
    onboardingSessionSchema.parse({
      clientSecret: `synthetic-${++calls}`,
      publishableKey: "pk_test_synthetic",
      expiresAt: Math.floor(Date.now() / 1000) + 600,
      account: payoutAccountDto(),
    }),
  );
  const { unmount } = renderWithProviders(
    <EmbeddedOnboarding
      createSession={createSession}
      onExit={vi.fn()}
      onRequestError={vi.fn()}
      onUnavailable={vi.fn()}
    />,
    { theme: quintalTheme },
  );
  await screen.findByRole("button", { name: "Sair do cadastro fake" });
  expect(sdk.options?.locale).toBe("pt-BR");
  expect(sdk.options?.appearance?.variables?.colorPrimary).toBe(quintalTheme.palette.primary.main);
  expect(await sdk.options!.fetchClientSecret()).toBe("synthetic-1");
  expect(await sdk.options!.fetchClientSecret()).toBe("synthetic-2");
  expect(createSession).toHaveBeenCalledTimes(2);
  unmount();
  expect(sdk.logout).toHaveBeenCalled();
});
it("REQ-PAYOUT-006 segredo inicial vencido é descartado antes de entregar ao SDK", async () => {
  let calls = 0;
  const createSession = vi.fn(async () =>
    onboardingSessionSchema.parse({
      clientSecret: `synthetic-${++calls}`,
      publishableKey: "pk_test_synthetic",
      expiresAt: calls === 1 ? 1 : Math.floor(Date.now() / 1000) + 600,
      account: payoutAccountDto(),
    }),
  );
  renderWithProviders(
    <EmbeddedOnboarding
      createSession={createSession}
      onExit={vi.fn()}
      onRequestError={vi.fn()}
      onUnavailable={vi.fn()}
    />,
    { theme: quintalTheme },
  );
  await screen.findByRole("button", { name: "Sair do cadastro fake" });
  expect(await sdk.options!.fetchClientSecret()).toBe("synthetic-2");
});
it("REQ-PAYOUT-007/010 encaminha saída e falha de script para o orquestrador", async () => {
  const onExit = vi.fn();
  const onUnavailable = vi.fn();
  const createSession = async () =>
    onboardingSessionSchema.parse({
      clientSecret: "synthetic",
      publishableKey: "pk_test_synthetic",
      expiresAt: 2000000000,
      account: payoutAccountDto(),
    });
  renderWithProviders(
    <EmbeddedOnboarding
      createSession={createSession}
      onExit={onExit}
      onRequestError={vi.fn()}
      onUnavailable={onUnavailable}
    />,
    { theme: quintalTheme },
  );
  fireEvent.click(await screen.findByRole("button", { name: "Sair do cadastro fake" }));
  fireEvent.click(screen.getByRole("button", { name: "Falhar script fake" }));
  expect(onExit).toHaveBeenCalledOnce();
  expect(onUnavailable).toHaveBeenCalledOnce();
});
it("REQ-PAYOUT-012 falha da API é traduzida pelo consumidor, sem inicializar SDK", async () => {
  const error = new Error("synthetic failure");
  const onRequestError = vi.fn();
  renderWithProviders(
    <EmbeddedOnboarding
      createSession={async () => {
        throw error;
      }}
      onExit={vi.fn()}
      onRequestError={onRequestError}
      onUnavailable={vi.fn()}
    />,
    { theme: quintalTheme },
  );
  await waitFor(() => expect(onRequestError).toHaveBeenCalledWith(error));
});
it("REQ-PAYOUT-010 falha do próprio script Connect oferece fallback mesmo antes de callbacks do iframe", async () => {
  const onUnavailable = vi.fn();
  const createSession = async () =>
    onboardingSessionSchema.parse({
      clientSecret: "synthetic",
      publishableKey: "pk_test_synthetic",
      expiresAt: 2000000000,
      account: payoutAccountDto(),
    });
  renderWithProviders(
    <EmbeddedOnboarding
      createSession={createSession}
      onExit={vi.fn()}
      onRequestError={vi.fn()}
      onUnavailable={onUnavailable}
    />,
    { theme: quintalTheme },
  );
  await screen.findByRole("button", { name: "Sair do cadastro fake" });
  const script = document.createElement("script");
  script.src = "https://connect-js.stripe.com/v1.0/connect.js";
  document.head.appendChild(script);
  try {
    script.dispatchEvent(new Event("error"));
    expect(onUnavailable).toHaveBeenCalledOnce();
  } finally {
    script.remove();
  }
});
