import { describe, expect, it } from "vitest";
import type { RegistrationInput } from "../schemas/registrationSchemas";
import { registrationCopy } from "./registrationCopy";
import { REGISTRATION_VARIANTS } from "./registrationVariants";

const { owner, host } = REGISTRATION_VARIANTS;
const { dataUse, steps, fields } = registrationCopy;

const ADDRESS_FIELDS = [
  "address.zipCode",
  "address.street",
  "address.number",
  "address.complement",
  "address.neighborhood",
  "address.city",
  "address.state",
];

const input: RegistrationInput = {
  fullName: " Camila Souza ",
  email: "Camila@Exemplo.com",
  password: "Senha#forte1",
  phone: "44999990000",
  birthDate: "15031990",
  cpf: "52998224725",
  address: {
    zipCode: "87020000",
    street: "Avenida Brasil",
    number: "120",
    complement: "",
    neighborhood: "Zona 01",
    city: "Maringá",
    state: "PR",
  },
};

const accountBody = {
  fullName: "Camila Souza",
  email: "camila@exemplo.com",
  password: "Senha#forte1",
  phone: "44999990000",
  birthDate: "1990-03-15",
  address: {
    zipCode: "87020000",
    street: "Avenida Brasil",
    number: "120",
    neighborhood: "Zona 01",
    city: "Maringá",
    state: "PR",
  },
};

/** Roda o resolver do RHF como o formulário faz. */
const resolve = (variant: typeof owner, values: RegistrationInput) =>
  variant.resolver(values, undefined, { fields: {}, shouldUseNativeValidation: false });

describe("REGISTRATION_VARIANTS", () => {
  it("REQ-OREG-008 REQ-HREG-004 cada variante tem o papel e a rota do BFF", () => {
    expect(owner).toMatchObject({ role: "owner", path: "/owners/register" });
    expect(host).toMatchObject({ role: "host", path: "/users/register" });
  });

  it("REQ-OREG-002 REQ-OREG-009 tutor: CPF no passo 1 e todos os campos na ordem da tela", () => {
    expect(owner.steps.map((step) => step.id)).toEqual(["person", "address"]);
    expect(owner.fields).toEqual(["fullName", "email", "password", "phone", "birthDate", "cpf", ...ADDRESS_FIELDS]);
  });

  it("REQ-HREG-001 anfitrião: os mesmos 2 passos, sem CPF", () => {
    expect(host.steps.map((step) => step.id)).toEqual(["person", "address"]);
    expect(host.fields).toEqual(["fullName", "email", "password", "phone", "birthDate", ...ADDRESS_FIELDS]);
    expect(host.steps[0].fields).not.toContain("cpf");
  });

  it("REQ-HREG-001 REQ-HREG-003 ajudas: só o anfitrião tem ajuda no topo do passo 1 e na senha", () => {
    expect(owner.intro).toEqual({ address: steps.address.why });
    expect(owner.passwordHelp).toBeUndefined();
    expect(host.intro).toEqual({
      person: "O CPF e os documentos ficam pra verificação, no próximo passo.",
      address: steps.address.hostWhy,
    });
    expect(host.passwordHelp).toBe("Se você também tem conta de tutor, esta senha é só da conta de anfitrião.");
    expect(host.passwordHelp).toBe(fields.hostPasswordHelp);
  });

  it("REQ-OREG-013 REQ-HREG-007 sucesso: pet e casa do tutor; verificação e casa do anfitrião", () => {
    expect(owner.success).toEqual({
      message: "Sua conta de tutor está pronta. Agora apresenta seu pet pra gente.",
      nextStep: { label: "Apresentar meu pet", href: "/pets/new" },
      laterHref: "/",
    });
    expect(host.success).toEqual({
      message:
        "Sua conta de anfitrião está pronta. Agora mostra quem você é: é rapidinho e protege quem deixa o pet com você.",
      nextStep: { label: "Começar a verificação", href: "/host/application" },
      laterHref: "/host",
    });
  });

  it("REQ-HREG-001 o que a gente faz com cada dado: o anfitrião não fala de CPF", () => {
    expect(owner.dataUse.map((item) => item.field)).toEqual(["Nome e celular", "CPF", "Endereço", "Senha"]);
    expect(host.dataUse).toEqual([dataUse.items.hostContact, dataUse.items.hostAddress, dataUse.items.password]);
    expect(host.dataUse.map((item) => item.field)).not.toContain("CPF");
  });

  it("REQ-OREG-008 resolver do tutor valida e devolve o corpo com CPF", async () => {
    const result = await resolve(owner, input);
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ ...accountBody, cpf: "52998224725" });
  });

  it("REQ-OREG-003 resolver do tutor recusa CPF vazio", async () => {
    const result = await resolve(owner, { ...input, cpf: "" });
    expect(result.errors).toHaveProperty("cpf");
  });

  it("REQ-HREG-002 REQ-HREG-004 resolver do anfitrião aceita CPF vazio e devolve o corpo sem CPF e sem role", async () => {
    const result = await resolve(host, { ...input, cpf: "" });
    expect(result.errors).toEqual({});
    expect(result.values).toEqual(accountBody);
    expect(result.values).not.toHaveProperty("role");
  });

  it("REQ-HREG-002 resolver do anfitrião aplica as mesmas regras da conta", async () => {
    const result = await resolve(host, { ...input, email: "camila@", cpf: "" });
    expect(Object.keys(result.errors)).toEqual(["email"]);
  });
});
