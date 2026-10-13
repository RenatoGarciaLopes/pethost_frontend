import { act, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { useRequestPasswordResetMutation, useResetPasswordMutation } from "./usePasswordMutations";

function ResetProbe() {
  const mutation = useResetPasswordMutation();
  return (
    <>
      <button onClick={() => mutation.mutate({ token: "valido", newPassword: "Abcdef1!" })}>Redefinir</button>
      <output>{mutation.status}</output>
    </>
  );
}
function ForgotProbe() {
  const mutation = useRequestPasswordResetMutation();
  return (
    <>
      <button onClick={() => mutation.mutate({ role: "host", email: "pessoa@exemplo.test" })}>Pedir</button>
      <output>{mutation.status}</output>
    </>
  );
}

describe("usePasswordMutations", () => {
  it("REQ-PWD-002 pedir link mantém a sessão e o cache", async () => {
    let body: unknown;
    server.use(
      http.post("*/api/auth/password/forgot", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(apiOk({}));
      }),
    );
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["pets"], ["pet"]);
    const { user } = renderWithProviders(<ForgotProbe />, { queryClient });
    await user.click(screen.getByRole("button", { name: "Pedir" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("success"));
    expect(body).toEqual({ email: "pessoa@exemplo.test", role: "host" });
    expect(queryClient.getQueryData(["pets"])).toEqual(["pet"]);
  });
  it.each(["sucesso", "erro HTTP", "erro de rede"])(
    "REQ-PWD-011 limpa queries e mutações após logout com %s",
    async (logoutResult) => {
      const calls: string[] = [];
      server.use(
        http.post("*/api/auth/password/reset", () => {
          calls.push("reset");
          return HttpResponse.json(apiOk({}));
        }),
        http.post("*/api/auth/sessions/logout", ({ request }) => {
          calls.push("logout");
          expect(request.headers.get("x-pethost-request")).toBe("1");
          if (logoutResult === "erro de rede") return HttpResponse.error();
          return logoutResult === "sucesso"
            ? HttpResponse.json(apiOk({}))
            : HttpResponse.json(apiFail("UNAVAILABLE"), { status: 502 });
        }),
      );
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(["pets"], ["pet"]);
      queryClient.getMutationCache().build(queryClient, { mutationKey: ["anterior"] });
      const { user } = renderWithProviders(<ResetProbe />, { queryClient });
      await user.click(screen.getByRole("button", { name: "Redefinir" }));
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("success"));
      expect(calls).toEqual(["reset", "logout"]);
      expect(queryClient.getQueryCache().getAll()).toEqual([]);
      expect(queryClient.getMutationCache().getAll()).toEqual([]);
    },
  );
  it("REQ-PWD-011 aguarda o logout antes de limpar cache e confirmar sucesso", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let logoutStarted = false;
    server.use(
      http.post("*/api/auth/password/reset", () => HttpResponse.json(apiOk({}))),
      http.post("*/api/auth/sessions/logout", async () => {
        logoutStarted = true;
        await pending;
        return HttpResponse.json(apiOk({}));
      }),
    );
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["pets"], ["pet"]);
    const { user } = renderWithProviders(<ResetProbe />, { queryClient });
    await user.click(screen.getByRole("button", { name: "Redefinir" }));
    await waitFor(() => expect(logoutStarted).toBe(true));
    expect(screen.getByRole("status")).toHaveTextContent("pending");
    expect(queryClient.getQueryData(["pets"])).toEqual(["pet"]);
    await act(async () => release());
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("success"));
    expect(queryClient.getQueryCache().getAll()).toEqual([]);
  });
  it("REQ-PWD-009 falha no reset não chama logout nem limpa cache", async () => {
    server.use(
      http.post("*/api/auth/password/reset", () => HttpResponse.json(apiFail("VALIDATION_ERROR"), { status: 400 })),
    );
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["pets"], ["pet"]);
    const { user } = renderWithProviders(<ResetProbe />, { queryClient });
    await user.click(screen.getByRole("button", { name: "Redefinir" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("error"));
    expect(queryClient.getQueryData(["pets"])).toEqual(["pet"]);
  });
});
