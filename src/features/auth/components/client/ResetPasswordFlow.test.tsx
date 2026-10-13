import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { passwordCopy } from "../../lib/passwordCopy";
import { ResetPasswordFlow } from "./ResetPasswordFlow";

const theme = quintalTheme;
const { reset, done } = passwordCopy;
const passwordField = () => screen.getByLabelText(/^Senha nova/);
beforeEach(() => window.history.replaceState({ etapa: 1 }, "", "/reset-password#token=valido"));
afterEach(() => vi.useRealTimers());

describe("ResetPasswordFlow", () => {
  it.each(["?token=query%2Bvalor&as=host#secao", "?as=host#token=fragmento%2Bvalor"])(
    "REQ-PWD-005 retira o token de %s e guarda o valor decodificado para enviar",
    async (suffix) => {
      window.history.replaceState({ etapa: 2 }, "", `/reset-password${suffix}`);
      const replace = vi.spyOn(window.history, "replaceState");
      let body: unknown;
      server.use(
        http.post("*/api/auth/password/reset", async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(apiOk({}));
        }),
        http.post("*/api/auth/sessions/logout", () => HttpResponse.json(apiOk({}))),
      );
      const { user } = renderWithProviders(<ResetPasswordFlow />, { theme });
      expect(window.location.href).not.toContain("token");
      expect(window.location.search).toBe("?as=host");
      expect(replace).toHaveBeenCalledTimes(1);
      expect(replace.mock.calls[0]?.[0]).toEqual({ etapa: 2 });
      await user.click(passwordField());
      await user.paste("Abcdef1!");
      await user.click(screen.getByRole("button", { name: reset.submit }));
      await screen.findByRole("heading", { name: done.title });
      expect(body).toEqual({
        token: suffix.includes("query") ? "query+valor" : "fragmento+valor",
        newPassword: "Abcdef1!",
      });
    },
  );

  it("REQ-PWD-006 sem token mostra o link incompleto e o caminho para pedir outro", () => {
    window.history.replaceState(null, "", "/reset-password");
    renderWithProviders(<ResetPasswordFlow />, { theme });
    expect(screen.getByText(reset.incomplete)).toBeVisible();
    expect(screen.getByRole("link", { name: reset.requestNew })).toHaveAttribute("href", "/forgot-password");
    expect(screen.queryByLabelText(/^Senha nova/)).not.toBeInTheDocument();
  });

  it("REQ-PWD-007 só libera o envio com as cinco regras de senha", async () => {
    const { user } = renderWithProviders(<ResetPasswordFlow />, { theme });
    const submit = screen.getByRole("button", { name: reset.submit });
    expect(submit).toBeDisabled();
    for (const weak of ["Ab1!", "abcdef1!", "ABCDEF1!", "Abcdefg!", "Abcdef12"]) {
      await user.clear(passwordField());
      await user.click(passwordField());
      await user.paste(weak);
      expect(submit).toBeDisabled();
    }
    await user.clear(passwordField());
    await user.click(passwordField());
    await user.paste("Abcdef1!");
    expect(submit).toBeEnabled();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("REQ-PWD-008 impede outro envio enquanto aguarda a resposta e sinaliza ocupado", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const bodies: unknown[] = [];
    server.use(
      http.post("*/api/auth/password/reset", async ({ request }) => {
        bodies.push(await request.json());
        await pending;
        return HttpResponse.json(apiOk({}));
      }),
      http.post("*/api/auth/sessions/logout", () => HttpResponse.json(apiOk({}))),
    );
    const { user } = renderWithProviders(<ResetPasswordFlow />, { theme });
    await user.click(passwordField());
    await user.paste("Abcdef1!");
    const form = passwordField().closest("form")!;
    await user.click(screen.getByRole("button", { name: reset.submit }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    const busy = screen.getByRole("button", { name: reset.submitting });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    fireEvent.submit(form);
    await act(async () => {});
    expect(bodies).toEqual([{ token: "valido", newPassword: "Abcdef1!" }]);
    await act(async () => release());
    expect(await screen.findByRole("heading", { name: done.title })).toBeVisible();
  });

  it("REQ-PWD-009 erro 400 na senha fica no campo e permite tentar outra com o mesmo token", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post("*/api/auth/password/reset", async ({ request }) => {
        bodies.push(await request.json());
        return bodies.length === 1
          ? HttpResponse.json(
              apiFail("VALIDATION_ERROR", "Inválido", [
                { field: "newPassword", messages: ["Escolha outra senha forte."] },
              ]),
              { status: 400 },
            )
          : HttpResponse.json(apiOk({}));
      }),
      http.post("*/api/auth/sessions/logout", () => HttpResponse.json(apiOk({}))),
    );
    const { user } = renderWithProviders(<ResetPasswordFlow />, { theme });
    await user.click(passwordField());
    await user.paste("Abcdef1!");
    await user.click(screen.getByRole("button", { name: reset.submit }));
    expect(await screen.findByText("Escolha outra senha forte.")).toBeVisible();
    expect(passwordField()).toHaveAttribute("aria-invalid", "true");
    expect(passwordField()).toHaveValue("Abcdef1!");
    expect(passwordField()).toHaveFocus();
    await user.clear(passwordField());
    await user.click(passwordField());
    await user.paste("Abcdef2!");
    await user.click(screen.getByRole("button", { name: reset.submit }));
    await screen.findByRole("heading", { name: done.title });
    expect(bodies).toEqual([
      { token: "valido", newPassword: "Abcdef1!" },
      { token: "valido", newPassword: "Abcdef2!" },
    ]);
  });

  it.each([
    [400, "VALIDATION_ERROR", [{ field: "token", messages: ["Token ausente."] }], reset.incomplete],
    [401, "AUTH_PASSWORD_RESET_TOKEN_INVALID", undefined, reset.expired],
  ] as const)(
    "REQ-PWD-006 e REQ-PWD-010 erro %s de token esconde o formulário e move o foco",
    async (status, code, details, message) => {
      server.use(
        http.post("*/api/auth/password/reset", () => HttpResponse.json(apiFail(code, code, details), { status })),
      );
      const { user } = renderWithProviders(<ResetPasswordFlow />, { theme });
      await user.click(passwordField());
      await user.paste("Abcdef1!");
      await user.click(screen.getByRole("button", { name: reset.submit }));
      expect(await screen.findByText(message)).toBeVisible();
      expect(screen.queryByLabelText(/^Senha nova/)).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: reset.requestNew })).toHaveAttribute("href", "/forgot-password");
      expect(screen.getByRole("heading", { name: reset.title })).toHaveFocus();
    },
  );

  it("REQ-PWD-011 sucesso encerra a sessão, limpa cache e apresenta confirmação com foco e link de login", async () => {
    const calls: string[] = [];
    server.use(
      http.post("*/api/auth/password/reset", () => {
        calls.push("reset");
        return HttpResponse.json(apiOk({}));
      }),
      http.post("*/api/auth/sessions/logout", () => {
        calls.push("logout");
        return HttpResponse.json(apiOk({}));
      }),
    );
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["pets"], ["pet"]);
    const { user } = renderWithProviders(<ResetPasswordFlow />, { queryClient, theme });
    await user.click(passwordField());
    await user.paste("Abcdef1!");
    await user.click(screen.getByRole("button", { name: reset.submit }));
    const heading = await screen.findByRole("heading", { name: done.title });
    expect(heading).toHaveFocus();
    expect(screen.getByText(done.body)).toBeVisible();
    expect(screen.getByRole("link", { name: done.login })).toHaveAttribute("href", "/login");
    expect(calls).toEqual(["reset", "logout"]);
    expect(queryClient.getQueryCache().getAll()).toEqual([]);
    expect(queryClient.getMutationCache().getAll()).toEqual([]);
    expect(screen.queryByLabelText(/^Senha nova/)).not.toBeInTheDocument();
  });

  it("REQ-PWD-012 contagem 429 bloqueia o envio e mantém a senha até liberar", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    let calls = 0;
    server.use(
      http.post("*/api/auth/password/reset", () => {
        calls++;
        return HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429, headers: { "Retry-After": "2" } });
      }),
    );
    renderWithProviders(<ResetPasswordFlow />, { theme });
    fireEvent.change(passwordField(), { target: { value: "Abcdef1!" } });
    fireEvent.click(screen.getByRole("button", { name: reset.submit }));
    await vi.waitFor(async () => {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByText(/tenta de novo em 2 segundos/)).toBeVisible();
    });
    const submit = screen.getByRole("button", { name: reset.submit });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(calls).toBe(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText(/tenta de novo em 1 segundo/)).toBeVisible();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(submit).toBeEnabled();
    expect(passwordField()).toHaveValue("Abcdef1!");
  });
});
