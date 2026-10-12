import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError } from "../errors/ApiError";
import { readApiResponse } from "./readApiResponse";

const schema = z.object({ id: z.string() });

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

async function catchError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("esperava ApiError");
}

describe("readApiResponse", () => {
  it("REQ-HTTP-001 devolve data validado", async () => {
    await expect(readApiResponse(json({ success: true, data: { id: "1" } }), schema)).resolves.toEqual({ id: "1" });
  });

  it("REQ-HTTP-001 204 devolve undefined quando o schema aceita", async () => {
    await expect(readApiResponse(new Response(null, { status: 204 }), z.undefined())).resolves.toBeUndefined();
  });

  it("REQ-HTTP-002 erro do envelope vira ApiError com Retry-After", async () => {
    const error = await catchError(
      readApiResponse(
        json(
          { success: false, error: { code: "TOO_MANY_REQUESTS", message: "x" } },
          { status: 429, headers: { "retry-after": "12" } },
        ),
        schema,
      ),
    );

    expect(error.status).toBe(429);
    expect(error.code).toBe("TOO_MANY_REQUESTS");
    expect(error.retryAfterSeconds).toBe(12);
  });

  it("REQ-HTTP-002 status de erro sem envelope vira UNEXPECTED_ERROR com o status", async () => {
    const error = await catchError(readApiResponse(new Response("<html>bad gateway</html>", { status: 502 }), schema));

    expect(error.status).toBe(502);
    expect(error.code).toBe("UNEXPECTED_ERROR");
  });

  it("REQ-HTTP-003 corpo fora do contrato vira CONTRACT_MISMATCH com os caminhos", async () => {
    const error = await catchError(readApiResponse(json({ success: true, data: { id: 7 } }), schema));

    expect(error.code).toBe("CONTRACT_MISMATCH");
    expect(error.invalidPaths).toEqual(["data.id"]);
  });

  it("REQ-HTTP-003 JSON ilegível em 200 vira CONTRACT_MISMATCH", async () => {
    const error = await catchError(readApiResponse(new Response("not json", { status: 200 }), schema));

    expect(error.code).toBe("CONTRACT_MISMATCH");
    expect(error.invalidPaths).toEqual(["(body)"]);
  });
});
