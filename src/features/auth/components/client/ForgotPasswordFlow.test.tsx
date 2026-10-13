import { act, fireEvent, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { errorCopy } from "@/shared/api/errors/errorCopy";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { passwordCopy } from "../../lib/passwordCopy";
import { PasswordScreen } from "../PasswordScreen";
import { ForgotPasswordFlow } from "./ForgotPasswordFlow";

const theme = quintalTheme;
const { forgot, sent } = passwordCopy;
const emailField = () => screen.getByRole("textbox", { name: /E-mail da conta/ });
afterEach(() => vi.useRealTimers());

describe("ForgotPasswordFlow", () => {
  it.each([
    ["owner", "Tutor"],
    ["host", "Anfitrião"],
  ] as const)("REQ-PWD-001 marca o papel inicial %s e permite escolher outro", async (initialRole, label) => {
    const { user } = renderWithProviders(
      <PasswordScreen>
        <ForgotPasswordFlow initialRole={initialRole} />
      </PasswordScreen>,
      { theme },
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "conteudo");
    expect(screen.getByRole("radio", { name: label })).toHaveAttribute("aria-checked", "true");
    const other = screen.getByRole("radio", { name: label === "Tutor" ? "Anfitrião" : "Tutor" });
    await user.click(other);
    expect(other).toHaveAttribute("aria-checked", "true");
  });

  it.each(["owner", "host", "admin"] as const)(
    "REQ-PWD-002 e REQ-PWD-003 envia papel %s e e-mail normalizado com confirmação neutra e foco",
    async (initialRole) => {
      let body: unknown;
      server.use(
        http.post("*/api/auth/password/forgot", async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(apiOk({}));
        }),
      );
      const { user, container } = renderWithProviders(<ForgotPasswordFlow initialRole={initialRole} />, { theme });
      if (initialRole === "admin") expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
      await user.click(emailField());
      await user.paste("  PESSOA@EXEMPLO.TEST  ");
      await user.click(screen.getByRole("button", { name: forgot.submit }));
      const heading = await screen.findByRole("heading", { name: sent.title, level: 1 });
      expect(body).toEqual({ email: "pessoa@exemplo.test", role: initialRole });
      expect(screen.getByText(sent.body)).toBeVisible();
      expect(container.textContent).not.toMatch(/pessoa@exemplo.test/i);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(heading).toHaveFocus();
      await user.click(screen.getByRole("button", { name: sent.otherEmail }));
      expect(emailField()).toHaveValue("");
      expect(screen.getByRole("heading", { name: forgot.title })).toHaveFocus();
      if (initialRole === "admin") expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
      else
        expect(screen.getByRole("radio", { name: forgot.roles[initialRole] })).toHaveAttribute("aria-checked", "true");
    },
  );

  it("REQ-PWD-002 valida e-mail obrigatório e inválido antes do HTTP", async () => {
    const { user } = renderWithProviders(<ForgotPasswordFlow initialRole="owner" />, { theme });
    await user.click(screen.getByRole("button", { name: forgot.submit }));
    expect(await screen.findByText("Falta o e-mail.")).toBeVisible();
    expect(emailField()).toHaveFocus();
    await user.click(emailField());
    await user.paste("incompleto");
    await user.click(screen.getByRole("button", { name: forgot.submit }));
    expect(await screen.findByText("Esse e-mail parece incompleto.")).toBeVisible();
  });

  it("REQ-PWD-004 só reenvia após 60 segundos, com o mesmo payload e aviso do link mais novo", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    const bodies: unknown[] = [];
    server.use(
      http.post("*/api/auth/password/forgot", async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(apiOk({}));
      }),
    );
    renderWithProviders(<ForgotPasswordFlow initialRole="host" />, { theme });
    fireEvent.change(emailField(), { target: { value: "PESSOA@EXEMPLO.TEST" } });
    fireEvent.click(screen.getByRole("button", { name: forgot.submit }));
    await vi.waitFor(async () => {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByRole("heading", { name: sent.title })).toBeInTheDocument();
    });
    const resend = screen.getByRole("button", { name: sent.resend });
    expect(resend).toBeDisabled();
    for (let second = 0; second < 59; second++)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    expect(resend).toBeDisabled();
    expect(screen.getByText(sent.resendIn(1))).toBeVisible();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(resend).toBeEnabled();
    fireEvent.click(resend);
    await vi.waitFor(async () => {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByText(sent.onlyNewest)).toBeVisible();
    });
    expect(bodies).toEqual([
      { email: "pessoa@exemplo.test", role: "host" },
      { email: "pessoa@exemplo.test", role: "host" },
    ]);
    expect(screen.getByRole("button", { name: sent.resend })).toBeDisabled();
  });

  it("REQ-PWD-002 mostra o 400 no campo, preserva o e-mail e permite corrigir", async () => {
    server.use(
      http.post("*/api/auth/password/forgot", () =>
        HttpResponse.json(
          apiFail("VALIDATION_ERROR", "Inválido", [{ field: "email", messages: ["Confira o endereço informado."] }]),
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWithProviders(<ForgotPasswordFlow initialRole="owner" />, { theme });
    await user.click(emailField());
    await user.paste("pessoa@exemplo.test");
    await user.click(screen.getByRole("button", { name: forgot.submit }));
    expect(await screen.findByText("Confira o endereço informado.")).toBeVisible();
    expect(emailField()).toHaveAttribute("aria-invalid", "true");
    expect(emailField()).toHaveValue("pessoa@exemplo.test");
    expect(emailField()).toHaveFocus();
    server.use(http.post("*/api/auth/password/forgot", () => HttpResponse.json(apiOk({}))));
    await user.clear(emailField());
    await user.click(emailField());
    await user.paste("outro@exemplo.test");
    await user.click(screen.getByRole("button", { name: forgot.submit }));
    expect(await screen.findByRole("heading", { name: sent.title })).toBeVisible();
  });

  it("REQ-PWD-012 mostra falha de rede e mantém o que foi digitado", async () => {
    server.use(http.post("*/api/auth/password/forgot", () => HttpResponse.error()));
    const { user } = renderWithProviders(<ForgotPasswordFlow initialRole="host" />, { theme });
    await user.click(emailField());
    await user.paste("pessoa@exemplo.test");
    await user.click(screen.getByRole("button", { name: forgot.submit }));
    await vi.waitFor(() => expect(screen.getByText(errorCopy.NETWORK_ERROR as string)).toBeVisible());
    expect(emailField()).toHaveValue("pessoa@exemplo.test");
    expect(screen.getByRole("radio", { name: "Anfitrião" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: forgot.submit })).toBeEnabled();
  });

  it("REQ-PWD-002 apresenta também o erro de validação do papel devolvido pela API", async () => {
    server.use(
      http.post("*/api/auth/password/forgot", () =>
        HttpResponse.json(
          apiFail("VALIDATION_ERROR", "Inválido", [
            { field: "role", messages: ["Essa conta não permite este pedido."] },
          ]),
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWithProviders(<ForgotPasswordFlow initialRole="owner" />, { theme });
    await user.click(emailField());
    await user.paste("pessoa@exemplo.test");
    await user.click(screen.getByRole("button", { name: forgot.submit }));
    expect(await screen.findByText("Essa conta não permite este pedido.")).toBeVisible();
    expect(emailField()).toHaveValue("pessoa@exemplo.test");
    expect(screen.getByRole("radio", { name: "Tutor" })).toHaveAttribute("aria-checked", "true");
  });

  it("REQ-PWD-012 bloqueia o pedido durante a contagem 429 e libera no fim", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    let calls = 0;
    server.use(
      http.post("*/api/auth/password/forgot", () => {
        calls++;
        return HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429, headers: { "Retry-After": "2" } });
      }),
    );
    renderWithProviders(<ForgotPasswordFlow initialRole="owner" />, { theme });
    fireEvent.change(emailField(), { target: { value: "pessoa@exemplo.test" } });
    fireEvent.click(screen.getByRole("button", { name: forgot.submit }));
    await vi.waitFor(async () => {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByText(/tenta de novo em 2 segundos/)).toBeVisible();
    });
    const submit = screen.getByRole("button", { name: forgot.submit });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(calls).toBe(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText(/tenta de novo em 1 segundo/)).toBeVisible();
    expect(submit).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(submit).toBeEnabled();
    expect(emailField()).toHaveValue("pessoa@exemplo.test");
  });
});
