import { act, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { useLogout } from "./useLogout";
const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
function setup() {
  router.replace.mockClear();
  let current: ReturnType<typeof useLogout>;
  function Probe() {
    current = useLogout();
    return (
      <button onClick={current.logout} disabled={current.isPending}>
        Sair
      </button>
    );
  }
  const result = renderWithProviders(<Probe />);
  result.queryClient.setQueryData(["account", "one", "profile"], { fullName: "Pessoa sintética" });
  result.queryClient.setQueryData(["account", "two", "profile"], { fullName: "Outra conta" });
  result.queryClient
    .getMutationCache()
    .build(result.queryClient, { mutationKey: ["antiga"], mutationFn: async () => undefined });
  return { ...result, current: () => current! };
}
it("REQ-SHELL-005 logout aguarda o BFF, impede repetição, limpa todos os caches e vai ao login", async () => {
  let calls = 0,
    release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.post("*/api/auth/sessions/logout", async ({ request }) => {
      calls++;
      expect(request.headers.get("x-pethost-request")).toBe("1");
      await pending;
      return HttpResponse.json(apiOk({}));
    }),
  );
  const probe = setup();
  act(() => {
    probe.current().logout();
    probe.current().logout();
  });
  await waitFor(() => expect(calls).toBe(1));
  expect(probe.current().isPending).toBe(true);
  expect(screen.getByRole("button", { name: "Sair" })).toBeDisabled();
  expect(probe.queryClient.getQueryCache().getAll()).toHaveLength(2);
  expect(router.replace).not.toHaveBeenCalled();
  await act(async () => release());
  await waitFor(() => expect(router.replace).toHaveBeenCalledExactlyOnceWith("/login"));
  expect(probe.queryClient.getQueryCache().getAll()).toEqual([]);
  expect(probe.queryClient.getMutationCache().getAll()).toEqual([]);
  await waitFor(() => expect(probe.current().isPending).toBe(false));
});
it.each(["http", "rede"])("REQ-SHELL-005 sai mesmo quando logout falha por %s", async (failure) => {
  server.use(
    http.post("*/api/auth/sessions/logout", () =>
      failure === "http" ? HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 503 }) : HttpResponse.error(),
    ),
  );
  const { user, queryClient } = setup();
  await user.click(screen.getByRole("button", { name: "Sair" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledExactlyOnceWith("/login"));
  expect(queryClient.getQueryCache().getAll()).toEqual([]);
  expect(queryClient.getMutationCache().getAll()).toEqual([]);
});
