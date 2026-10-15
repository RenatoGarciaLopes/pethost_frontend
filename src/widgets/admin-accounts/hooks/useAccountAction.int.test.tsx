import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { createTestQueryClient } from "@/test/render";
import { server } from "@/test/msw/server";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { adminHostFixture, adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { adminHostQueries } from "@/features/hosts";
import { adminOwnerQueries } from "@/features/owners";
import { useAccountAction } from "./useAccountAction";
it("REQ-AACC-010/015/016 reset salva detalhe e invalida todos os filtros de anfitriões", async () => {
  const host = adminHostFixture({ stripeStatus: "rejected" });
  const client = createTestQueryClient();
  client.setQueryData(adminHostQueries.list("admin", "rejected").queryKey, [host]);
  client.setQueryData(adminHostQueries.list("admin", "in_progress").queryKey, []);
  const auditKey = ["account", "admin", "admin", "audit-entries", { targetType: "host", targetId: host.id }];
  client.setQueryData(auditKey, []);
  server.use(
    http.post("*/api/hosts/:id/stripe-account-reset", () =>
      HttpResponse.json(apiOk({ ...host, stripeStatus: "not_started", stripeConnected: false })),
    ),
  );
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useAccountAction("admin", "hosts", host.id), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({ action: "resetStripe", reason: "Conferido" });
  });
  expect(client.getQueryData(adminHostQueries.detail("admin", host.id).queryKey)?.stripeStatus).toBe("not_started");
  expect(client.getQueryState(adminHostQueries.list("admin", "rejected").queryKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(adminHostQueries.list("admin", "in_progress").queryKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(auditKey)?.isInvalidated).toBe(false);
  client.clear();
});
it("REQ-AACC-011/016 erro de regra recarrega detalhe sem repetir ação", async () => {
  const owner = adminOwnerFixture();
  let posts = 0;
  const client = createTestQueryClient();
  client.setQueryData(adminOwnerQueries.detail("admin", owner.id).queryKey, owner);
  server.use(
    http.post("*/api/owners/:id/cpf-release", () => {
      posts++;
      return HttpResponse.json(apiFail("OWNER_SUSPENSION_REQUIRED"), { status: 422 });
    }),
    http.get("*/api/owners/:id", () => HttpResponse.json(apiOk({ ...owner, cpf: null }))),
  );
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => ({
      action: useAccountAction("admin", "owners", owner.id),
      detail: useQuery(adminOwnerQueries.detail("admin", owner.id)),
    }),
    { wrapper },
  );
  await act(async () => {
    await expect(result.current.action.mutateAsync({ action: "release", reason: "Conferido" })).rejects.toMatchObject({
      status: 422,
    });
  });
  await waitFor(() => expect(result.current.detail.data?.cpf).toBeNull());
  expect(posts).toBe(1);
  client.clear();
});
