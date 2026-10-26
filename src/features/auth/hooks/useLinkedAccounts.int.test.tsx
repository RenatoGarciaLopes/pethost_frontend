import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient } from "@/test/render";
import { useLinkedAccounts } from "./useLinkedAccounts";

it("REQ-SWITCH-003 usa cache por usuário e não repete dados frescos por 60 segundos", async () => {
  const now = Date.now();
  vi.spyOn(Date, "now").mockReturnValue(now);
  let calls = 0;
  server.use(
    http.get("*/api/users/me/accounts", () => {
      calls++;
      return HttpResponse.json(apiOk([{ role: "owner", isActive: true, isCurrent: true }]));
    }),
  );
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const first = renderHook(({ userId }) => useLinkedAccounts(userId), { wrapper, initialProps: { userId: "user-1" } });
  await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
  expect(queryClient.getQueryData(accountQueryKey("user-1", "linked-accounts"))).toEqual(first.result.current.data);
  first.unmount();
  const second = renderHook(({ userId }) => useLinkedAccounts(userId), { wrapper, initialProps: { userId: "user-1" } });
  expect(second.result.current.isSuccess).toBe(true);
  expect(calls).toBe(1);
  second.unmount();
  vi.mocked(Date.now).mockReturnValue(now + 59_999);
  const third = renderHook(({ userId }) => useLinkedAccounts(userId), { wrapper, initialProps: { userId: "user-1" } });
  expect(third.result.current.isFetching).toBe(false);
  expect(calls).toBe(1);
  third.rerender({ userId: "user-2" });
  await waitFor(() => expect(third.result.current.isSuccess).toBe(true));
  expect(calls).toBe(2);
  vi.mocked(Date.now).mockReturnValue(now + 60_001);
  third.rerender({ userId: "user-1" });
  await waitFor(() => expect(third.result.current.isFetching).toBe(false));
  expect(calls).toBe(3);
});
it("REQ-SWITCH-003 erro na lista permite refazer a consulta", async () => {
  server.use(
    http.get("*/api/users/me/accounts", () => HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 503 })),
  );
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useLinkedAccounts("user-1"), { wrapper });
  await waitFor(() => expect(result.current.isError).toBe(true));
  server.use(http.get("*/api/users/me/accounts", () => HttpResponse.json(apiOk([]))));
  await result.current.refetch();
  await waitFor(() => expect(result.current.data).toEqual([]));
});
