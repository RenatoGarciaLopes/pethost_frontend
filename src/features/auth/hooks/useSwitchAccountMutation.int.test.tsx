import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { expect, it } from "vitest";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient } from "@/test/render";
import { useSwitchAccountMutation } from "./useSwitchAccountMutation";

function setup() {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(["account", "anterior", "pets"], ["pet"]);
  queryClient.getMutationCache().build(queryClient, { mutationKey: ["anterior"] });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useSwitchAccountMutation(), { wrapper }) };
}
it("REQ-SWITCH-005 e REQ-SWITCH-006 envia só papel e senha e limpa todo o cache no sucesso sem navegar", async () => {
  let body: unknown;
  const location = window.location.href;
  server.use(
    http.post("*/api/auth/sessions/switch", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(apiOk({ user: { ...sessionUserFixture, role: "host" } }));
    }),
  );
  const { result, queryClient } = setup();
  act(() => result.current.mutate({ role: "host", password: "senha-sintetica" }));
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(body).toEqual({ role: "host", password: "senha-sintetica" });
  expect(result.current.data?.user.role).toBe("host");
  expect(queryClient.getQueryCache().getAll()).toEqual([]);
  expect(queryClient.getMutationCache().getAll()).toEqual([]);
  expect(window.location.href).toBe(location);
});
it.each([
  [404, "AUTH_LINKED_ACCOUNT_NOT_FOUND"],
  [429, "TOO_MANY_REQUESTS"],
] as const)("REQ-SWITCH-007 e REQ-SWITCH-008 falha %s mantém o cache e preserva o erro", async (status, code) => {
  server.use(
    http.post("*/api/auth/sessions/switch", () =>
      HttpResponse.json(apiFail(code), { status, headers: { "Retry-After": "37" } }),
    ),
  );
  const { result, queryClient } = setup();
  act(() => result.current.mutate({ role: "host", password: "senha-sintetica" }));
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.error).toMatchObject({ status, code, ...(status === 429 ? { retryAfterSeconds: 37 } : {}) });
  expect(queryClient.getQueryData(["account", "anterior", "pets"])).toEqual(["pet"]);
  expect(queryClient.getMutationCache().getAll()).toHaveLength(2);
});
