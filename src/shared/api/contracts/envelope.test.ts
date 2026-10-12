import { describe, expect, it } from "vitest";
import { z } from "zod";
import { apiErrorEnvelopeSchema, apiSuccessSchema } from "./envelope";

const userSchema = z.object({ id: z.string(), fullName: z.string() });

describe("apiSuccessSchema", () => {
  it("REQ-HTTP-001 valida data com o schema do contrato", () => {
    const parsed = apiSuccessSchema(userSchema).parse({
      success: true,
      data: { id: "1", fullName: "Camila Souza" },
      timestamp: "2026-10-08T12:00:00.000+00:00",
    });

    expect(parsed.data.fullName).toBe("Camila Souza");
  });

  it("REQ-HTTP-001 recusa data fora do contrato", () => {
    const result = apiSuccessSchema(userSchema).safeParse({ success: true, data: { id: 1 }, timestamp: "x" });

    expect(result.success).toBe(false);
  });

  it("REQ-HTTP-001 recusa envelope de erro como sucesso", () => {
    const result = apiSuccessSchema(userSchema).safeParse({ success: false, error: { code: "X", message: "y" } });

    expect(result.success).toBe(false);
  });

  it("REQ-HTTP-001 aceita resposta sem corpo de dados (204 ou data omitido)", () => {
    expect(apiSuccessSchema(z.undefined()).parse({ success: true, timestamp: "x" }).data).toBeUndefined();
  });
});

describe("apiErrorEnvelopeSchema", () => {
  it("REQ-HTTP-002 lê detalhes de validação por campo", () => {
    const parsed = apiErrorEnvelopeSchema.parse({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: [{ field: "address.zipCode", messages: ["Zip code is invalid."] }],
      },
      timestamp: "x",
    });

    expect(parsed.error.details).toEqual([{ field: "address.zipCode", messages: ["Zip code is invalid."] }]);
  });

  it("REQ-HTTP-002 lê o traceId do erro 500", () => {
    const parsed = apiErrorEnvelopeSchema.parse({
      success: false,
      error: { code: "UNEXPECTED_ERROR", message: "An unexpected error occurred.", details: { traceId: "0HN7" } },
      timestamp: "x",
    });

    expect(parsed.error.details).toEqual({ traceId: "0HN7" });
  });

  it("REQ-HTTP-002 aceita erro sem detalhes", () => {
    const parsed = apiErrorEnvelopeSchema.parse({
      success: false,
      error: { code: "AUTH_INVALID_CREDENTIALS", message: "Email or password is incorrect." },
    });

    expect(parsed.error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });
});
