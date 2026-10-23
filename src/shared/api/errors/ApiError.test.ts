import { describe, expect, it } from "vitest";
import { ApiError, hasErrorCode, isApiError } from "./ApiError";

describe("ApiError.fromEnvelope", () => {
  it("REQ-HTTP-002 agrupa as mensagens por campo, mantendo o caminho aninhado", () => {
    const error = ApiError.fromEnvelope(400, {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: [
        { field: "email", messages: ["Email is required."] },
        { field: "address.zipCode", messages: ["Zip code is invalid.", "Zip code is required."] },
      ],
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.fieldIssues).toEqual({
      email: [{ code: null, params: {}, message: "Email is required." }],
      "address.zipCode": [
        { code: null, params: {}, message: "Zip code is invalid." },
        { code: null, params: {}, message: "Zip code is required." },
      ],
    });
    expect(error.traceId).toBeUndefined();
  });

  it("REQ-HTTP-002 junta mensagens repetidas do mesmo campo", () => {
    const error = ApiError.fromEnvelope(400, {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: [
        { field: "password", messages: ["a"] },
        { field: "password", messages: ["b"] },
      ],
    });

    expect(error.fieldIssues.password?.map((issue) => issue.message)).toEqual(["a", "b"]);
  });

  it("REQ-HTTP-002 casa errors[i] com messages[i] e guarda código e params", () => {
    const error = ApiError.fromEnvelope(400, {
      code: "VALIDATION_ERROR",
      message: "x",
      details: [
        {
          field: "checkIn",
          messages: ["Check-in must be at least 72 hours ahead."],
          errors: [{ code: "BOOKING_CHECK_IN_TOO_SOON", params: { minimumHours: 72 } }],
        },
      ],
    });

    expect(error.fieldIssues.checkIn).toEqual([
      {
        code: "BOOKING_CHECK_IN_TOO_SOON",
        params: { minimumHours: 72 },
        message: "Check-in must be at least 72 hours ahead.",
      },
    ]);
  });

  it("REQ-HTTP-002 errors com tamanho diferente de messages é ignorado (sem código)", () => {
    const error = ApiError.fromEnvelope(400, {
      code: "VALIDATION_ERROR",
      message: "x",
      details: [{ field: "a", messages: ["x", "y"], errors: [{ code: "FIELD_REQUIRED" }] }],
    });

    expect(error.fieldIssues.a?.map((issue) => issue.code)).toEqual([null, null]);
  });

  it("REQ-HTTP-002 lê o traceId e o Retry-After", () => {
    expect(
      ApiError.fromEnvelope(500, { code: "UNEXPECTED_ERROR", message: "x", details: { traceId: "0HN7" } }).traceId,
    ).toBe("0HN7");
    expect(
      ApiError.fromEnvelope(429, { code: "TOO_MANY_REQUESTS", message: "x" }, { retryAfterSeconds: 42 })
        .retryAfterSeconds,
    ).toBe(42);
  });
});

describe("ApiError.parseRetryAfter", () => {
  it("REQ-HTTP-002 aceita segundos e ignora valores inválidos", () => {
    expect(ApiError.parseRetryAfter("30")).toBe(30);
    expect(ApiError.parseRetryAfter(null)).toBeUndefined();
    expect(ApiError.parseRetryAfter("abc")).toBeUndefined();
    expect(ApiError.parseRetryAfter("-3")).toBeUndefined();
  });

  it("REQ-HTTP-002 converte data HTTP em segundos a partir de agora", () => {
    const now = Date.parse("2026-10-11T12:00:00Z");

    expect(ApiError.parseRetryAfter("Sun, 11 Oct 2026 12:01:00 GMT", now)).toBe(60);
    expect(ApiError.parseRetryAfter("Sun, 11 Oct 2026 11:00:00 GMT", now)).toBe(0);
  });
});

describe("erros locais", () => {
  it("REQ-HTTP-004 networkError tem status 0 e guarda a causa", () => {
    const cause = new TypeError("fetch failed");
    const error = ApiError.networkError(cause);

    expect(error.status).toBe(0);
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.cause).toBe(cause);
  });

  it("REQ-HTTP-003 contractMismatch guarda os caminhos inválidos, não o corpo", () => {
    const error = ApiError.contractMismatch(200, ["data.user.email"]);

    expect(error.code).toBe("CONTRACT_MISMATCH");
    expect(error.invalidPaths).toEqual(["data.user.email"]);
    expect(error.message).not.toContain("{");
  });
});

describe("guards", () => {
  it("REQ-HTTP-002 isApiError e hasErrorCode", () => {
    const error = ApiError.networkError(new Error("x"));

    expect(isApiError(error)).toBe(true);
    expect(isApiError(new Error("x"))).toBe(false);
    expect(hasErrorCode(error, "NETWORK_ERROR")).toBe(true);
    expect(hasErrorCode(error, "UNAUTHORIZED")).toBe(false);
    expect(hasErrorCode("nada", "NETWORK_ERROR")).toBe(false);
  });

  it("REQ-HTTP-002 serializa sem perder os campos (para logs e RSC)", () => {
    const json = ApiError.fromEnvelope(409, { code: "AUTH_EMAIL_ALREADY_REGISTERED", message: "x" }).toJSON();

    expect(json).toEqual({
      name: "ApiError",
      status: 409,
      code: "AUTH_EMAIL_ALREADY_REGISTERED",
      message: "x",
      fieldIssues: {},
      retryAfterSeconds: undefined,
      traceId: undefined,
      invalidPaths: [],
    });
  });
});
