import { describe, expect, it } from "vitest";
import { z } from "zod";
import { unwrapData } from "./unwrapData";

describe("unwrapData", () => {
  it("REQ-HTTP-001 extrai o schema de data do envelope gerado (union com null)", () => {
    const inner = z.object({ id: z.string() });
    const generated = z.object({
      success: z.boolean(),
      data: z.union([z.null(), inner]),
      error: z.union([z.null(), z.object({ code: z.string() })]),
    });

    const data = unwrapData(generated);

    expect(data.parse({ id: "1" })).toEqual({ id: "1" });
    expect(data.safeParse(null).success).toBe(false);
  });

  it("REQ-HTTP-001 desembrulha data opcional e anulável (data: union nullish)", () => {
    const inner = z.object({ id: z.string() });

    expect(unwrapData(z.object({ data: z.union([z.null(), inner]).optional() }))).toBe(inner);
    expect(unwrapData(z.object({ data: inner.nullish() }))).toBe(inner);
  });

  it("REQ-HTTP-001 mantém união de vários ramos sem o null", () => {
    const data = unwrapData(z.object({ data: z.union([z.null(), z.string(), z.number()]) }));

    expect(data.parse(1)).toBe(1);
    expect(data.safeParse(null).success).toBe(false);
  });

  it("REQ-HTTP-001 aceita data sem union", () => {
    const inner = z.array(z.string());

    expect(unwrapData(z.object({ data: inner }))).toBe(inner);
  });
});
