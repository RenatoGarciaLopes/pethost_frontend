import { describe, expect, it } from "vitest";
import { ApiError } from "../errors/ApiError";
import { createQueryClient, getQueryClient, shouldRetry } from "./queryClient";

describe("getQueryClient", () => {
  it("REQ-HTTP-018 no servidor cria uma instância nova por chamada", () => {
    expect(getQueryClient({ isServer: true })).not.toBe(getQueryClient({ isServer: true }));
  });

  it("REQ-HTTP-018 no navegador reaproveita a mesma instância", () => {
    expect(getQueryClient({ isServer: false })).toBe(getQueryClient({ isServer: false }));
  });

  it("REQ-HTTP-018 staleTime acima de zero evita refazer a busca logo após a hidratação", () => {
    expect(createQueryClient().getDefaultOptions().queries?.staleTime).toBeGreaterThan(0);
  });
});

describe("shouldRetry", () => {
  it("REQ-HTTP-004 repete rede caída e 5xx até 2 vezes; nunca 4xx nem sessão vencida", () => {
    expect(shouldRetry(0, ApiError.networkError(new Error("x")))).toBe(true);
    expect(shouldRetry(1, new ApiError({ status: 503, code: "X", message: "x" }))).toBe(true);
    expect(shouldRetry(2, new ApiError({ status: 503, code: "X", message: "x" }))).toBe(false);
    expect(shouldRetry(0, new ApiError({ status: 404, code: "X", message: "x" }))).toBe(false);
    expect(shouldRetry(0, new ApiError({ status: 401, code: "SESSION_EXPIRED", message: "x" }))).toBe(false);
    expect(shouldRetry(0, new Error("bug"))).toBe(false);
  });
});
