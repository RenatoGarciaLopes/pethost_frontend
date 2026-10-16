import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { auditQueries } from "@/features/admin-audit";
import { createTestQueryClient } from "@/test/render";
import { server } from "@/test/msw/server";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { adminHostFixture, adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { auditPageFixture, auditPageModelFixture } from "@/test/fixtures/audit";
import { adminHostQueries } from "@/features/hosts";
import { adminOwnerQueries } from "@/features/owners";
import { useAccountAction } from "./useAccountAction";

it.each([
  ["owners", "suspend", "suspension"],
  ["owners", "release", "cpf-release"],
  ["owners", "lift", "suspension"],
  ["hosts", "suspend", "suspension"],
  ["hosts", "release", "identity-release"],
  ["hosts", "lift", "suspension"],
  ["hosts", "resetStripe", "stripe-account-reset"],
] as const)("%s/%s atualiza trilha ativa apenas do mesmo admin e alvo", async (kind, action, endpoint) => {
  const account = kind === "owners" ? adminOwnerFixture() : adminHostFixture();
  const target = { targetType: kind === "owners" ? "owner" : "host", targetId: account.id };
  const filters = { ...target, page: 1, pageSize: 10 };
  const client = createTestQueryClient();
  const activeKey = auditQueries.page("admin", filters).queryKey;
  const otherTarget = auditQueries.page("admin", { ...filters, targetId: "other-target" }).queryKey;
  const otherAdmin = auditQueries.page("other-admin", filters).queryKey;
  const nextPage = auditQueries.page("admin", { ...filters, page: 2 }).queryKey;
  for (const key of [activeKey, otherTarget, otherAdmin, nextPage]) client.setQueryData(key, auditPageModelFixture([]));
  let reads = 0;
  server.use(
    (action === "lift" ? http.delete : http.post)(`*/api/${kind}/:id/${endpoint}`, () =>
      HttpResponse.json(apiOk(account)),
    ),
    http.get("*/api/audit-entries", () => {
      reads++;
      return HttpResponse.json(apiOk(auditPageFixture()));
    }),
  );
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result, unmount } = renderHook(
    () => ({
      action: useAccountAction("admin", kind, account.id),
      trail: useQuery(auditQueries.page("admin", filters)),
    }),
    { wrapper },
  );
  expect(reads).toBe(0);
  await act(async () => {
    await result.current.action.mutateAsync(action === "lift" ? { action } : { action, reason: "Conferido" });
  });
  await waitFor(() => expect(result.current.trail.data?.items).toHaveLength(1));
  expect(reads).toBe(1);
  expect(client.getQueryState(nextPage)?.isInvalidated).toBe(true);
  expect(client.getQueryState(otherTarget)?.isInvalidated).toBe(false);
  expect(client.getQueryState(otherAdmin)?.isInvalidated).toBe(false);
  unmount();
  client.clear();
});

it("REQ-AACC-010/015/016 reset salva detalhe e invalida todos os filtros de anfitriões", async () => {
  const host = adminHostFixture({ stripeStatus: "rejected" });
  const client = createTestQueryClient();
  client.setQueryData(adminHostQueries.list("admin", "rejected").queryKey, [host]);
  client.setQueryData(adminHostQueries.list("admin", "in_progress").queryKey, []);
  const auditKey = auditQueries.page("admin", {
    page: 1,
    pageSize: 10,
    targetType: "host",
    targetId: host.id,
  }).queryKey;
  client.setQueryData(auditKey, auditPageModelFixture([]));
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
  expect(client.getQueryState(auditKey)?.isInvalidated).toBe(true);
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
