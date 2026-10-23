import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { PasswordChangeForm } from "./PasswordChangeForm";

const STRONG = "Nova#senha1";

function setup(role: "owner" | "host" = "owner") {
  return renderWithProviders(<PasswordChangeForm role={role} />, { theme: quintalTheme });
}
const current = () => screen.getByLabelText(/^Senha atual/);
const next = () => screen.getByLabelText(/^Senha nova/);
const submit = () => screen.getByRole("button", { name: "Trocar senha" });

describe("trocar a senha", () => {
  it.each(["owner", "host"] as const)(
    "REQ-ACC-018 REQ-ACC-021 campos, aviso dos outros aparelhos e esqueci com a conta %s",
    (role) => {
      setup(role);
      expect(screen.getByRole("heading", { level: 1, name: "Trocar a senha" })).toBeInTheDocument();
      expect(screen.getByText("Ao trocar, os outros aparelhos saem da conta. Este continua.")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Esqueci minha senha atual" })).toHaveAttribute(
        "href",
        `/forgot-password?as=${role}`,
      );
      expect(screen.getAllByRole("button", { name: "Mostrar" })).toHaveLength(2);
    },
  );

  it("REQ-ACC-018 só libera com a senha atual e a nova cumprindo a régua", async () => {
    const { user } = setup();
    expect(submit()).toBeDisabled();
    await user.type(current(), "senha-antiga");
    await user.type(next(), "fraca");
    expect(submit()).toBeDisabled();
    await user.clear(next());
    await user.type(next(), STRONG);
    expect(submit()).toBeEnabled();
  });

  it("REQ-ACC-019 envia uma vez, limpa os campos e confirma; o cache fica", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post("*/api/users/me/password", async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(apiOk({ user: sessionUserFixture }));
      }),
    );
    const { user, queryClient } = setup();
    queryClient.setQueryData(["account", "user-1", "profile"], { fullName: "Camila" });
    await user.type(current(), "senha-antiga");
    await user.type(next(), STRONG);
    await user.click(submit());

    expect(await screen.findByText("Senha trocada. Os outros aparelhos saíram da conta.")).toBeInTheDocument();
    expect(bodies).toEqual([{ currentPassword: "senha-antiga", newPassword: STRONG }]);
    expect(current()).toHaveValue("");
    expect(next()).toHaveValue("");
    expect(queryClient.getQueryData(["account", "user-1", "profile"])).toEqual({ fullName: "Camila" });
  });

  it("REQ-ACC-020 senha atual errada limpa só ela e mostra o erro no campo", async () => {
    server.use(
      http.post("*/api/users/me/password", () =>
        HttpResponse.json(
          apiFail("VALIDATION_ERROR", "Inválido", [
            {
              field: "currentPassword",
              messages: ["A senha atual não confere."],
              errors: [{ code: "FIELD_INVALID_FORMAT" }],
            },
          ]),
          { status: 400 },
        ),
      ),
    );
    const { user } = setup();
    await user.type(current(), "errada");
    await user.type(next(), STRONG);
    await user.click(submit());

    expect(await screen.findByText("Esse formato não é válido. Confere o que foi digitado.")).toBeInTheDocument();
    expect(current()).toHaveValue("");
    expect(next()).toHaveValue(STRONG);
    await waitFor(() => expect(current()).toHaveFocus());
  });

  it("REQ-ACC-020 erro na senha nova vai para o campo dela", async () => {
    server.use(
      http.post("*/api/users/me/password", () =>
        HttpResponse.json(
          apiFail("VALIDATION_ERROR", "Inválido", [
            {
              field: "newPassword",
              messages: ["A senha nova não pode ser igual à atual."],
              errors: [{ code: "FIELD_INVALID_FORMAT" }],
            },
          ]),
          { status: 400 },
        ),
      ),
    );
    const { user } = setup();
    await user.type(current(), STRONG);
    await user.type(next(), STRONG);
    await user.click(submit());

    expect(await screen.findByText("Esse formato não é válido. Confere o que foi digitado.")).toBeInTheDocument();
    expect(current()).toHaveValue(STRONG);
  });

  it("REQ-ACC-028 limite de tentativas mostra a contagem e trava o envio", async () => {
    server.use(
      http.post("*/api/users/me/password", () =>
        HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429, headers: { "Retry-After": "30" } }),
      ),
    );
    const { user } = setup();
    await user.type(current(), "senha-antiga");
    await user.type(next(), STRONG);
    await user.click(submit());

    expect(await screen.findByText(/30 segundos/)).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });
});
