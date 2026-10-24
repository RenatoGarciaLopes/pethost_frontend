import { describe, expect, it } from "vitest";
import { ApiError } from "../errors/ApiError";
import { bffErrorResponse, bffSuccessResponse } from "./bffResponse";

describe("bffErrorResponse", () => {
  it("REQ-HTTP-010 devolve o erro da API no envelope, com status, details e Retry-After", async () => {
    const response = bffErrorResponse(
      ApiError.fromEnvelope(
        400,
        {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: [{ field: "address.zipCode", messages: ["x"] }],
        },
        { retryAfterSeconds: 9 },
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("retry-after")).toBe("9");
    expect(body).toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: [{ field: "address.zipCode", messages: ["x"] }],
      },
    });
    expect(typeof body.timestamp).toBe("string");
  });

  it("REQ-HTTP-010 repassa os códigos e params dos motivos, e só quando todos têm código", async () => {
    const body = await bffErrorResponse(
      ApiError.fromEnvelope(400, {
        code: "VALIDATION_ERROR",
        message: "x",
        details: [
          {
            field: "checkIn",
            messages: ["a"],
            errors: [{ code: "BOOKING_CHECK_IN_TOO_SOON", params: { minimumHours: 72 } }],
          },
          { field: "name", messages: ["b"] },
        ],
      }),
    ).json();

    expect(body.error.details).toEqual([
      {
        field: "checkIn",
        messages: ["a"],
        errors: [{ code: "BOOKING_CHECK_IN_TOO_SOON", params: { minimumHours: 72 } }],
      },
      { field: "name", messages: ["b"] },
    ]);
  });

  it("REQ-HTTP-010 repassa os params do erro de topo", async () => {
    const body = await bffErrorResponse(
      ApiError.fromEnvelope(422, { code: "BOOKING_CAPACITY_EXCEEDED", message: "x", params: { date: "2026-12-22" } }),
    ).json();

    expect(body.error.params).toEqual({ date: "2026-12-22" });
  });

  it("REQ-HTTP-002 preserva o traceId do 500", async () => {
    const body = await bffErrorResponse(
      ApiError.fromEnvelope(500, { code: "UNEXPECTED_ERROR", message: "x", details: { traceId: "T1" } }),
    ).json();

    expect(body.error.details).toEqual({ traceId: "T1" });
  });

  it("REQ-HTTP-003 API fora do contrato ou fora do ar vira 502, sem vazar detalhes", async () => {
    const mismatch = bffErrorResponse(ApiError.contractMismatch(200, ["data.user.email"]));
    const offline = bffErrorResponse(ApiError.networkError(new Error("ECONNREFUSED 10.0.0.5")));

    expect(mismatch.status).toBe(502);
    expect((await mismatch.json()).error).toEqual({ code: "CONTRACT_MISMATCH", message: "Upstream contract mismatch" });
    expect(offline.status).toBe(502);
    expect((await offline.json()).error).toEqual({ code: "UPSTREAM_UNAVAILABLE", message: "Upstream unavailable" });
  });

  it("REQ-HTTP-002 erro que não é ApiError vira 500 genérico", async () => {
    const response = bffErrorResponse(new Error("segredo interno"));

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("segredo");
  });
});

describe("bffSuccessResponse", () => {
  it("REQ-HTTP-001 envolve os dados no envelope", async () => {
    const response = bffSuccessResponse({ user: { id: "1" } }, 201);

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ success: true, data: { user: { id: "1" } } });
  });
});
