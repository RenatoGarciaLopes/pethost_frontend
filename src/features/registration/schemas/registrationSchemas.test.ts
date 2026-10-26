import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registrationCopy } from "../lib/registrationCopy";
import { hostRegistrationSchema, ownerRegistrationSchema, type RegistrationInput } from "./registrationSchemas";

const errors = registrationCopy.fieldErrors;

/** Cadastro válido em 12/10/2026 (relógio fixo). */
const valid: RegistrationInput = {
  fullName: "  Camila Souza  ",
  email: "  Camila@Exemplo.COM ",
  password: "Senha#forte1",
  phone: "44999990000",
  birthDate: "15031990",
  cpf: "52998224725",
  address: {
    zipCode: "87020000",
    street: "Rua das Flores",
    number: "s/n",
    complement: "",
    neighborhood: "Centro",
    city: "Maringá",
    state: "pr",
  },
};

const withField = (patch: Partial<RegistrationInput>) => ({ ...valid, ...patch });
const withAddress = (patch: Partial<RegistrationInput["address"]>) => ({
  ...valid,
  address: { ...valid.address, ...patch },
});

type AccountSchema = typeof hostRegistrationSchema | typeof ownerRegistrationSchema;

/** Mensagens de erro de um caminho (`address.zipCode`). */
function messagesOf(input: unknown, path: string, schema: AccountSchema = ownerRegistrationSchema): string[] {
  const result = schema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.filter((issue) => issue.path.join(".") === path).map((issue) => issue.message);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 12, 12));
});
afterEach(() => vi.useRealTimers());

// As regras da conta são as mesmas no tutor e no anfitrião (REQ-HREG-002).
describe.each([
  { name: "ownerRegistrationSchema", schema: ownerRegistrationSchema as AccountSchema },
  { name: "hostRegistrationSchema", schema: hostRegistrationSchema as AccountSchema },
])("$name: regras da conta", ({ schema }) => {
  const messages = (input: unknown, path: string) => messagesOf(input, path, schema);

  it("REQ-OREG-003 REQ-HREG-002 aceita o cadastro válido e normaliza nome, e-mail, número e UF", () => {
    const parsed = schema.parse(valid);
    expect(parsed.fullName).toBe("Camila Souza");
    expect(parsed.email).toBe("camila@exemplo.com");
    expect(parsed.address.number).toBe("S/N");
    expect(parsed.address.state).toBe("PR");
    expect(parsed.address.complement).toBe("");
  });

  it("REQ-OREG-003 REQ-HREG-002 nome obrigatório e até 120", () => {
    expect(messages(withField({ fullName: "   " }), "fullName")).toEqual([errors.fullNameMissing]);
    expect(messages(withField({ fullName: "a".repeat(120) }), "fullName")).toEqual([]);
    expect(messages(withField({ fullName: "a".repeat(121) }), "fullName")).toEqual([errors.tooLong(120)]);
  });

  it("REQ-OREG-003 REQ-HREG-002 e-mail obrigatório, válido e até 160", () => {
    expect(messages(withField({ email: "" }), "email")).toContain(errors.emailMissing);
    expect(messages(withField({ email: "camila@" }), "email")).toEqual([errors.emailInvalid]);
    const local = "a".repeat(60);
    const at160 = `${local}@${"b".repeat(160 - local.length - 1 - 4)}.com`;
    expect(at160).toHaveLength(160);
    expect(messages(withField({ email: at160 }), "email")).not.toContain(errors.tooLong(160));
    expect(messages(withField({ email: `a${at160}` }), "email")).toContain(errors.tooLong(160));
  });

  it("REQ-OREG-003 REQ-HREG-002 senha precisa cumprir a régua", () => {
    expect(messages(withField({ password: "senhafraca" }), "password")).toEqual([errors.passwordWeak]);
    expect(messages(withField({ password: "Aa1#" }), "password")).toEqual([errors.passwordWeak]);
  });

  it("REQ-OREG-003 REQ-HREG-002 celular com DDD tem 10 ou 11 dígitos", () => {
    expect(messages(withField({ phone: "4433334444" }), "phone")).toEqual([]);
    expect(messages(withField({ phone: "44999990000" }), "phone")).toEqual([]);
    expect(messages(withField({ phone: "449999" }), "phone")).toEqual([errors.phoneInvalid]);
    expect(messages(withField({ phone: "449999900001" }), "phone")).toEqual([errors.phoneInvalid]);
  });

  it("REQ-OREG-003 REQ-HREG-002 nascimento: falta, não existe, futuro e menor de 18", () => {
    expect(messages(withField({ birthDate: "" }), "birthDate")).toEqual([errors.birthDateMissing]);
    expect(messages(withField({ birthDate: "3102199" }), "birthDate")).toEqual([errors.birthDateInvalid]);
    expect(messages(withField({ birthDate: "30022000" }), "birthDate")).toEqual([errors.birthDateInvalid]);
    expect(messages(withField({ birthDate: "13102026" }), "birthDate")).toEqual([errors.birthDateFuture]);
    expect(messages(withField({ birthDate: "13102008" }), "birthDate")).toEqual([errors.underage]);
    // 18 anos completos hoje passa.
    expect(messages(withField({ birthDate: "12102008" }), "birthDate")).toEqual([]);
  });

  it("REQ-OREG-003 REQ-HREG-002 endereço com as regras da API", () => {
    expect(messages(withAddress({ zipCode: "8702000" }), "address.zipCode")).toEqual([errors.zipCode]);
    expect(messages(withAddress({ street: " " }), "address.street")).toEqual([errors.street]);
    expect(messages(withAddress({ street: "r".repeat(121) }), "address.street")).toEqual([errors.tooLong(120)]);
    expect(messages(withAddress({ number: "" }), "address.number")).toEqual([errors.number]);
    expect(messages(withAddress({ number: "12345678901" }), "address.number")).toEqual([errors.tooLong(10)]);
    expect(messages(withAddress({ complement: "c".repeat(61) }), "address.complement")).toEqual([errors.tooLong(60)]);
    expect(messages(withAddress({ neighborhood: "" }), "address.neighborhood")).toEqual([errors.neighborhood]);
    expect(messages(withAddress({ city: "c".repeat(81) }), "address.city")).toEqual([errors.tooLong(80)]);
    expect(messages(withAddress({ state: "XX" }), "address.state")).toEqual([errors.state]);
  });
});

describe("ownerRegistrationSchema", () => {
  it("REQ-OREG-003 CPF obrigatório e com dígitos verificadores", () => {
    expect(messagesOf(withField({ cpf: "" }), "cpf")).toContain(errors.cpfMissing);
    expect(messagesOf(withField({ cpf: "52998224724" }), "cpf")).toEqual([errors.cpfInvalid]);
    expect(messagesOf(withField({ cpf: "11111111111" }), "cpf")).toEqual([errors.cpfInvalid]);
  });
});

describe("hostRegistrationSchema", () => {
  it("REQ-HREG-002 não pede CPF: sem a chave, vazio ou inválido, passa e o CPF não sai", () => {
    const withoutCpf = Object.fromEntries(Object.entries(valid).filter(([key]) => key !== "cpf"));
    for (const input of [withoutCpf, withField({ cpf: "" }), withField({ cpf: "11111111111" })]) {
      const result = hostRegistrationSchema.safeParse(input);
      expect(result.success).toBe(true);
      expect(result.data).not.toHaveProperty("cpf");
    }
  });
});
