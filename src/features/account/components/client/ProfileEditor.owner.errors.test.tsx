import { messageFor, field, saveButton, createProfileSetup } from "@/test/profileEditor";
import { ProfileEditor } from "./ProfileEditor";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { ownerProfileDtoFixture as dto } from "@/test/fixtures/account";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
const setupProfile = createProfileSetup(ProfileEditor);
it.each([
  ["OWNER_CPF_LOCKED", "CPF", "16899535009", "529.982.247-25"],
  ["OWNER_BIRTH_DATE_LOCKED", "Quando você nasceu", "04051990", "03/05/1990"],
] as const)(
  "REQ-ACC-007 %s desfaz só a identidade e preserva o nome para reenviar",
  async (code, label, next, original) => {
    const bodies: unknown[] = [];
    server.use(
      http.patch("*/api/owners/me", async ({ request }) => {
        bodies.push(await request.json());
        return bodies.length === 1
          ? HttpResponse.json(apiFail(code), { status: 422 })
          : HttpResponse.json(apiOk({ ...dto, user: { ...dto.user, fullName: "Camila Teste" } }));
      }),
    );
    const { user } = await setupProfile();
    if (label === "CPF") await user.click(screen.getByRole("button", { name: "Mostrar" }));
    await user.clear(field(label));
    await user.type(field(label), next);
    await user.clear(field("Seu nome completo"));
    await user.type(field("Seu nome completo"), "Camila Teste");
    await user.type(field("Sua senha atual"), "senha-atual");
    await user.click(saveButton());
    await waitFor(() => expect(field(label)).toHaveAttribute("readonly"));
    expect(field(label)).toHaveValue(original);
    expect(field(label)).toHaveAccessibleDescription(messageFor(code));
    expect(field("Seu nome completo")).toHaveValue("Camila Teste");
    expect(screen.queryByLabelText(/^Sua senha atual/)).not.toBeInTheDocument();
    await user.click(saveButton());
    await screen.findByText("Pronto, guardado.");
    expect(bodies[1]).toEqual({ fullName: "Camila Teste" });
  },
  // Muita digitação: com a suíte inteira em paralelo, 5 s não bastam.
  15_000,
);
it.each([
  ["fullName", "Seu nome completo"],
  ["address.street", "Rua"],
])("REQ-ACC-008 VALIDATION_ERROR em %s aparece no campo e permite corrigir", async (name, label) => {
  server.use(
    http.patch("*/api/owners/me", () =>
      HttpResponse.json(
        apiFail("VALIDATION_ERROR", "Inválido", [
          { field: name, messages: ["Confira esse dado."], errors: [{ code: "FIELD_INVALID_FORMAT" }] },
        ]),
        {
          status: 400,
        },
      ),
    ),
  );
  const { user } = await setupProfile();
  await user.clear(field(label));
  await user.type(field(label), "Outro valor");
  await user.click(saveButton());
  await screen.findByText("Esse formato não é válido. Confere o que foi digitado.");
  expect(field(label)).toHaveAccessibleDescription("Esse formato não é válido. Confere o que foi digitado.");
  expect(field(label)).toHaveFocus();
  expect(field(label)).toHaveValue("Outro valor");
});
it("REQ-ACC-008 senha atual inválida é apagada e mantém o novo CPF", async () => {
  server.use(
    http.patch("*/api/owners/me", () =>
      HttpResponse.json(
        apiFail("VALIDATION_ERROR", "Inválido", [
          {
            field: "currentPassword",
            messages: ["Confere sua senha atual."],
            errors: [{ code: "FIELD_INVALID_FORMAT" }],
          },
        ]),
        { status: 400 },
      ),
    ),
  );
  const { user } = await setupProfile();
  await user.click(screen.getByRole("button", { name: "Mostrar" }));
  await user.clear(field("CPF"));
  await user.type(field("CPF"), "16899535009");
  await user.type(field("Sua senha atual"), "errada");
  await user.click(saveButton());
  await screen.findByText("Esse formato não é válido. Confere o que foi digitado.");
  expect(field("Sua senha atual")).toHaveValue("");
  expect(field("Sua senha atual")).toHaveFocus();
  expect(field("CPF")).toHaveValue("168.995.350-09");
});
it("REQ-ACC-008 CPF de outra conta aparece no campo sem apagar o CPF digitado", async () => {
  server.use(
    http.patch("*/api/owners/me", () => HttpResponse.json(apiFail("OWNER_CPF_ALREADY_REGISTERED"), { status: 409 })),
  );
  const { user } = await setupProfile();
  await user.click(screen.getByRole("button", { name: "Mostrar" }));
  await user.clear(field("CPF"));
  await user.type(field("CPF"), "16899535009");
  await user.type(field("Sua senha atual"), "senha-atual");
  await user.click(saveButton());
  await screen.findByText(messageFor("OWNER_CPF_ALREADY_REGISTERED"));
  expect(field("CPF")).toHaveFocus();
  expect(field("CPF")).toHaveValue("168.995.350-09");
});
it("REQ-ACC-028 limite de tentativas conta o tempo e trava Salvar sem perder a edição", async () => {
  server.use(
    http.patch("*/api/owners/me", () =>
      HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429, headers: { "Retry-After": "30" } }),
    ),
  );
  const { user } = await setupProfile();
  await user.clear(field("Seu nome completo"));
  await user.type(field("Seu nome completo"), "Camila Teste");
  await user.click(saveButton());
  await screen.findByText(/30 segundos/);
  expect(saveButton()).toBeDisabled();
  expect(field("Seu nome completo")).toHaveValue("Camila Teste");
  await screen.findByText(/29 segundos/, {}, { timeout: 2200 });
});
it("REQ-ACC-002 erro de carregamento oferece uma nova consulta ao tentar de novo", async () => {
  let calls = 0;
  server.use(
    http.get("*/api/owners/me", () => {
      calls++;
      return calls === 1
        ? HttpResponse.json(apiFail("OWNER_NOT_FOUND"), { status: 404 })
        : HttpResponse.json(apiOk(dto));
    }),
  );
  const { user } = renderWithProviders(<ProfileEditor userId="user-1" role="owner" />, { theme: quintalTheme });
  server.use(http.get("https://viacep.com.br/ws/:cep/json/", () => HttpResponse.json({ erro: true })));
  await screen.findByText(messageFor("OWNER_NOT_FOUND"));
  await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
  await screen.findByRole("heading", { level: 1, name: "Seu perfil" });
  expect(calls).toBe(2);
  expect(field("E-mail")).toHaveValue(dto.user.email);
});
it("REQ-ACC-008 erro de rede mantém o que foi digitado e mostra a frase genérica", async () => {
  server.use(http.patch("*/api/owners/me", () => HttpResponse.error()));
  const { user } = await setupProfile();
  await user.clear(field("Seu nome completo"));
  await user.type(field("Seu nome completo"), "Camila Teste");
  await user.click(saveButton());
  await screen.findByText(messageFor("NETWORK_ERROR"));
  expect(field("Seu nome completo")).toHaveValue("Camila Teste");
  expect(saveButton()).toBeEnabled();
});
