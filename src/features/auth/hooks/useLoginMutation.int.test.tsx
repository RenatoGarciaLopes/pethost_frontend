import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { useLoginMutation, useReactivateMutation } from "./useLoginMutation";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/shared/api/client/bffClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api/client/bffClient")>();
  return { ...actual, bffClient: actual.createBffClient({ baseUrl: "http://api.test/api" }) };
});
beforeEach(() => {
  router.replace.mockClear();
  router.refresh.mockClear();
});

function Probe({
  role,
  next,
  reactivate = false,
}: {
  role: "owner" | "host" | "admin";
  next?: string;
  reactivate?: boolean;
}) {
  const login = useLoginMutation(next);
  const reactivation = useReactivateMutation(next);
  const mutation = reactivate ? reactivation : login;
  return (
    <>
      <button
        onClick={() => {
          if (reactivate && role !== "admin") reactivation.mutate({ email: "a@b.com", password: "x", role });
          else login.mutate({ email: "a@b.com", password: "x", role });
        }}
      >
        Enviar
      </button>
      <output>{mutation.isError ? "erro" : mutation.isPending ? "enviando" : "pronto"}</output>
    </>
  );
}

it.each([
  ["owner", undefined, "/"],
  ["host", "//outside.test", "/host"],
  ["admin", "/api/users", "/admin/host-applications"],
  ["owner", "/pets?tab=all", "/pets?tab=all"],
] as const)("REQ-AUTH-005/006 limpa cache e navega com papel %s next %s", async (role, next, destination) => {
  server.use(
    http.post("http://api.test/api/auth/sessions/login", () =>
      HttpResponse.json(apiOk({ user: { ...sessionUserFixture, role } })),
    ),
  );
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(["private", "old-account"], { secret: "antigo" });
  const { user } = renderWithProviders(<Probe role={role} next={next} />, { queryClient });
  await user.click(screen.getByRole("button", { name: "Enviar" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith(destination));
  expect(router.refresh).toHaveBeenCalledOnce();
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
});
it.each(["owner", "host"] as const)("REQ-AUTH-008 reativação %s abre sessão e limpa cache", async (role) => {
  server.use(
    http.post(`http://api.test/api/${role === "owner" ? "owners" : "hosts"}/reactivate`, () =>
      HttpResponse.json(apiOk({ user: { ...sessionUserFixture, role } })),
    ),
  );
  const { user, queryClient } = renderWithProviders(<Probe role={role} next="/pets" reactivate />);
  queryClient.setQueryData(["antigo"], "dado");
  await user.click(screen.getByRole("button"));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/pets"));
  expect(queryClient.getQueryData(["antigo"])).toBeUndefined();
  expect(router.refresh).toHaveBeenCalledOnce();
});
it("REQ-AUTH-007 falha preserva cache e não navega", async () => {
  server.use(
    http.post("http://api.test/api/auth/sessions/login", () =>
      HttpResponse.json(apiFail("AUTH_INVALID_CREDENTIALS"), { status: 401 }),
    ),
  );
  const { user, queryClient } = renderWithProviders(<Probe role="owner" />);
  queryClient.setQueryData(["antigo"], "dado");
  await user.click(screen.getByRole("button"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("erro"));
  expect(queryClient.getQueryData(["antigo"])).toBe("dado");
  expect(router.replace).not.toHaveBeenCalled();
  expect(router.refresh).not.toHaveBeenCalled();
});
