import { describe, expect, it } from "vitest";
import { normalizeNode } from "./openapi-transformer.mjs";

describe("normalizeNode", () => {
  it("REQ-TOOL-008 transforma integer|string em integer e remove o pattern", () => {
    const schema: Record<string, unknown> = { type: ["integer", "string"], pattern: "^-?(?:0|[1-9]\d*)$", default: 1 };
    normalizeNode(schema);
    expect(schema).toEqual({ type: "integer", default: 1 });
  });

  it("REQ-TOOL-008 preserva o null de número opcional", () => {
    const schema: Record<string, unknown> = { type: ["null", "number", "string"], pattern: "x" };
    normalizeNode(schema);
    expect(schema).toEqual({ type: ["number", "null"] });
  });

  it("REQ-TOOL-008 não mexe em string pura nem em string|null", () => {
    const schema: Record<string, unknown> = { type: ["string", "null"], pattern: "^a$" };
    normalizeNode(schema);
    expect(schema).toEqual({ type: ["string", "null"], pattern: "^a$" });
  });

  it("REQ-TOOL-008 percorre objetos e listas aninhados", () => {
    const document = { paths: { "/x": { get: { parameters: [{ schema: { type: ["integer", "string"] } }] } } } };
    normalizeNode(document);
    expect(document.paths["/x"].get.parameters[0].schema).toEqual({ type: "integer" });
  });
});

describe("relaxNullableRequired", () => {
  it("REQ-TOOL-008 campo anulável deixa de ser obrigatório (a API omite null)", () => {
    const schema = {
      type: "object",
      required: ["id", "avatarUrl", "address", "phone"],
      properties: {
        id: { type: "string" },
        avatarUrl: { type: ["string", "null"] },
        address: { oneOf: [{ type: "null" }, { $ref: "#/components/schemas/Address" }] },
        phone: { anyOf: [{ type: "string" }, { type: "null" }] },
      },
    };
    normalizeNode(schema);
    expect(schema.required).toEqual(["id"]);
  });

  it("REQ-TOOL-008 remove required vazio e não mexe em objeto sem required", () => {
    const allNullable = { type: "object", required: ["a"], properties: { a: { type: ["string", "null"] } } };
    const noRequired = { type: "object", properties: { a: { type: "string" } } };
    normalizeNode(allNullable);
    normalizeNode(noRequired);
    expect(allNullable).not.toHaveProperty("required");
    expect(noRequired).toEqual({ type: "object", properties: { a: { type: "string" } } });
  });
});
