import { messageFor, field, saveButton, createProfileSetup } from "@/test/profileEditor";
import { ProfileEditor } from "./ProfileEditor";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { accountAddressFixture, hostProfileDtoFixture as dto } from "@/test/fixtures/account";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
const setupProfile = createProfileSetup(ProfileEditor);
it("REQ-ACC-009 anfitrião PF tem identidade travada e telefone e endereço livres", async () => {
  await setupProfile("host", dto);
  for (const label of ["Seu nome completo", "Quando você nasceu", "CPF"]) {
    expect(field(label)).toHaveAttribute("readonly");
    expect(field(label)).toHaveAccessibleDescription(messageFor("HOST_IDENTITY_LOCKED"));
  }
  expect(field("Celular com DDD")).not.toHaveAttribute("readonly");
  expect(field("Rua")).toBeEnabled();
  expect(screen.queryByLabelText(/^CNPJ/)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/^Sua senha atual/)).not.toBeInTheDocument();
});
it("REQ-ACC-009 anfitrião PJ edita nome fantasia e endereço da empresa com CNPJ e razão social travados", async () => {
  const company = {
    cnpj: "11222333000181",
    legalName: "Empresa de Teste",
    tradeName: "Cantinho",
    address: accountAddressFixture,
  };
  let body: unknown;
  server.use(
    http.patch("*/api/hosts/me", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(
        apiOk({
          ...dto,
          personType: "company",
          company: { ...company, tradeName: "Novo Cantinho", address: { ...company.address, number: "20" } },
        }),
      );
    }),
  );
  const { user } = await setupProfile("host", { ...dto, personType: "company", company });
  expect(field("CNPJ")).toHaveAttribute("readonly");
  expect(field("Razão social")).toHaveAttribute("readonly");
  expect(field("CNPJ")).toHaveAccessibleDescription(messageFor("HOST_IDENTITY_LOCKED"));
  await user.clear(field("Nome fantasia"));
  await user.type(field("Nome fantasia"), "Novo Cantinho");
  const companyFields = within(screen.getByRole("group", { name: "Sua empresa" }));
  const number = companyFields.getByLabelText(/^Número/);
  await user.clear(number);
  await user.type(number, "20");
  await user.click(saveButton());
  await screen.findByText("Pronto, guardado.");
  expect(body).toEqual({ tradeName: "Novo Cantinho", companyAddress: { ...accountAddressFixture, number: "20" } });
});
it("REQ-ACC-010 HOST_IDENTITY_LOCKED mantém identidade original e outras alterações", async () => {
  server.use(http.patch("*/api/hosts/me", () => HttpResponse.json(apiFail("HOST_IDENTITY_LOCKED"), { status: 422 })));
  const { user } = await setupProfile("host", dto);
  await user.clear(field("Celular com DDD"));
  await user.type(field("Celular com DDD"), "11999999999");
  await user.click(saveButton());
  await screen.findByText(messageFor("HOST_IDENTITY_LOCKED"), { selector: '[role="alert"] *' });
  expect(field("Seu nome completo")).toHaveValue(dto.user.fullName);
  expect(field("CPF")).toHaveValue("***.***.247-25");
  expect(field("Celular com DDD")).toHaveValue("(11) 99999-9999");
  expect(saveButton()).toBeEnabled();
});
it("REQ-ACC-002/011 anfitrião não aprovado usa dados da conta sem data, edição ou foto editável", async () => {
  const loading = setupProfile("host", dto);
  server.use(
    http.get("*/api/hosts/me", () => HttpResponse.json(apiFail("HOST_NOT_FOUND"), { status: 404 })),
    http.get("*/api/users/me", () => HttpResponse.json(apiOk(dto.user))),
  );
  await loading;
  await screen.findAllByText(messageFor("HOST_NOT_FOUND"));
  expect(screen.getByRole("link", { name: "Ir pra verificação" })).toHaveAttribute("href", "/host/application");
  for (const label of ["Seu nome completo", "E-mail", "Celular com DDD", "Quando você nasceu", "CPF"])
    expect(field(label)).toHaveAttribute("readonly");
  expect(field("Rua")).toBeDisabled();
  expect(screen.queryByText(/No PetHost desde/)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Trocar foto")).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("CS")).toBeInTheDocument());
});

it("REQ-ACC-013 CPF travado pode ser revelado e escondido sem liberar edição", async () => {
  const { user } = await setupProfile("host", dto);
  await user.click(screen.getByRole("button", { name: "Mostrar" }));
  expect(field("CPF")).toHaveValue("529.982.247-25");
  expect(field("CPF")).toHaveAttribute("readonly");
  await user.click(screen.getByRole("button", { name: "Esconder" }));
  expect(field("CPF")).toHaveValue("***.***.247-25");
});
