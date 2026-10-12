import { describe, expect, it } from "vitest";
import { createAddressSchema } from "./address";

const messages = {
  zipCode: "cep",
  street: "rua",
  number: "numero",
  neighborhood: "bairro",
  city: "cidade",
  state: "uf",
  tooLong: (max: number) => `max ${max}`,
};
const schema = createAddressSchema(messages);
const valid = {
  zipCode: "87020000",
  street: " Rua das Flores ",
  number: "123",
  complement: "",
  neighborhood: "Centro",
  city: "Maringá",
  state: "pr",
};
const errorsOf = (input: Record<string, string>) =>
  schema.safeParse(input).error?.issues.map((issue) => `${issue.path.join(".")}:${issue.message}`) ?? [];

describe("createAddressSchema", () => {
  it("REQ-OREG-003 normaliza: apara textos, UF em maiúsculas, complemento vazio", () => {
    expect(schema.parse(valid)).toEqual({ ...valid, street: "Rua das Flores", state: "PR" });
  });

  it.each(["s/n", "S/N", "s / n"])("REQ-OREG-003 número aceita %s como S/N", (number) => {
    expect(schema.parse({ ...valid, number }).number).toBe("S/N");
  });

  it("REQ-OREG-003 CEP precisa de 8 dígitos", () => {
    expect(errorsOf({ ...valid, zipCode: "8702000" })).toEqual(["zipCode:cep"]);
    expect(errorsOf({ ...valid, zipCode: "87020-000" })).toEqual(["zipCode:cep"]);
  });

  it("REQ-OREG-003 obrigatórios com mensagem própria (espaços não contam)", () => {
    expect(errorsOf({ ...valid, street: " ", number: "", neighborhood: "", city: "" })).toEqual([
      "street:rua",
      "number:numero",
      "neighborhood:bairro",
      "city:cidade",
    ]);
  });

  it.each([
    ["street", 120],
    ["number", 10],
    ["complement", 60],
    ["neighborhood", 80],
    ["city", 80],
  ])("REQ-OREG-003 %s aceita até %i caracteres", (field, max) => {
    expect(errorsOf({ ...valid, [field]: "a".repeat(max) })).toEqual([]);
    expect(errorsOf({ ...valid, [field]: "a".repeat(max + 1) })).toEqual([`${field}:max ${max}`]);
  });

  it("REQ-OREG-003 UF fora das 27 é recusada", () => {
    expect(errorsOf({ ...valid, state: "XX" })).toEqual(["state:uf"]);
    expect(errorsOf({ ...valid, state: "" })).toEqual(["state:uf"]);
  });
});
