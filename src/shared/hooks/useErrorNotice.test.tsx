import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/errors/ApiError";
import { GENERIC_ERROR_MESSAGE } from "@/shared/api/errors/translateError";
import { useErrorNotice } from "./useErrorNotice";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("useErrorNotice", () => {
  it("REQ-PWD-012 apresenta erro genérico sem expor mensagem desconhecida e permite limpar", () => {
    const { result } = renderHook(() => useErrorNotice());
    expect(result.current).toMatchObject({ message: null, tone: "erro", blocked: false });
    act(() =>
      result.current.report(
        new ApiError({ status: 500, code: "CODIGO_DESCONHECIDO", message: "Texto interno da API" }),
      ),
    );
    expect(result.current.message).toBe(GENERIC_ERROR_MESSAGE);
    expect(result.current.tone).toBe("erro");
    act(() => result.current.clear());
    expect(result.current.message).toBeNull();
  });

  it.each(["development", "production"])("REQ-PWD-012 falha inesperada em %s usa aviso genérico", (mode) => {
    vi.stubEnv("NODE_ENV", mode);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useErrorNotice());
    act(() => result.current.report(new Error("Falha inesperada")));
    expect(result.current.message).toBe(GENERIC_ERROR_MESSAGE);
    expect(log).toHaveBeenCalledTimes(mode === "production" ? 0 : 1);
  });

  it("REQ-PWD-012 429 sem Retry-After espera 30 segundos e encerra em zero", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useErrorNotice());
    act(() => result.current.report(new ApiError({ status: 429, code: "TOO_MANY_REQUESTS", message: "Limite" })));
    expect(result.current).toMatchObject({ tone: "atencao", blocked: true });
    expect(result.current.message).toContain("30 segundos");
    for (let second = 0; second < 29; second++)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    expect(result.current.message).toContain("1 segundo.");
    expect(result.current.blocked).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current).toMatchObject({ message: null, blocked: false, tone: "erro" });
  });

  it("REQ-PWD-012 não deixa a contagem cair abaixo de zero", () => {
    const { result } = renderHook(() => useErrorNotice());
    act(() =>
      result.current.report(
        new ApiError({ status: 429, code: "TOO_MANY_REQUESTS", message: "Limite", retryAfterSeconds: 0 }),
      ),
    );
    expect(result.current).toMatchObject({ message: null, blocked: false });
  });
});
