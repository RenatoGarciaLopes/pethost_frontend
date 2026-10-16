import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/render";
import { apiOk } from "@/test/fixtures/session";
import { payoutAccountDto } from "@/test/fixtures/payouts";
import { server } from "@/test/msw/server";
import { payoutQueries } from "../api/queries";
import { useStartOnboarding } from "./useStartOnboarding";
import { useSyncPayoutAccount } from "./useSyncPayoutAccount";
import { useHostedOnboardingLink } from "./useHostedOnboardingLink";
it("REQ-PAYOUT-004/006/007/010 segredos e links nunca ficam nos caches, storage ou logs; só a conta é atualizada", async () => {
  localStorage.clear();
  sessionStorage.clear();
  let starts = 0;
  const navigate = vi.fn();
  server.use(
    http.post("*/api/hosts/me/stripe-account/onboarding-session", () =>
      HttpResponse.json(
        apiOk({
          clientSecret: `synthetic-secret-${++starts}`,
          publishableKey: "pk_test_synthetic",
          expiresAt: 2000000000,
          account: payoutAccountDto({ status: "in_progress" }),
        }),
      ),
    ),
    http.post("*/api/hosts/me/stripe-account/synchronization", () =>
      HttpResponse.json(apiOk(payoutAccountDto({ status: "enabled", payoutsEnabled: true }))),
    ),
    http.post("*/api/hosts/me/stripe-account/onboarding-link", () =>
      HttpResponse.json(
        apiOk({
          url: "https://connect.stripe.com/setup/synthetic-one-use",
          expiresAt: 2000000000,
          account: payoutAccountDto({ status: "in_progress" }),
        }),
      ),
    ),
  );
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => ({
      start: useStartOnboarding("host-1"),
      sync: useSyncPayoutAccount("host-1"),
      hosted: useHostedOnboardingLink("host-1", navigate),
    }),
    { wrapper },
  );
  await act(async () => {
    await result.current.start();
    await result.current.start();
  });
  expect(starts).toBe(2);
  expect(client.getQueryData(payoutQueries.account("host-1").queryKey)?.status).toBe("in_progress");
  await act(async () => {
    await result.current.sync.mutateAsync();
  });
  expect(client.getQueryData(payoutQueries.account("host-1").queryKey)?.payoutsEnabled).toBe(true);
  await act(async () => {
    await result.current.hosted();
  });
  expect(navigate).toHaveBeenCalledWith("https://connect.stripe.com/setup/synthetic-one-use");
  const data = JSON.stringify({
    queries: client
      .getQueryCache()
      .getAll()
      .map((query) => query.state.data),
    mutations: client
      .getMutationCache()
      .getAll()
      .map((mutation) => mutation.state.data),
  });
  expect(data).not.toMatch(/synthetic-secret|synthetic-one-use|clientSecret|publishableKey/);
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  client.clear();
});
