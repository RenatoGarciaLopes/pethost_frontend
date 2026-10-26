import { renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCelebrateOnce } from "./useCelebrateOnce";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("useCelebrateOnce", () => {
  it("REQ-HVER-016 comemora na primeira visita da aprovação e não nas seguintes", () => {
    const first = renderHook(() => useCelebrateOnce("aprovada-1"), { wrapper: StrictMode });
    expect(first.result.current).toBe(true);
    first.unmount();

    expect(renderHook(() => useCelebrateOnce("aprovada-1")).result.current).toBe(false);
    expect(localStorage.getItem("pethost.celebrated.aprovada-1")).toBe("1");
  });

  it("REQ-HVER-016 cada solicitação aprovada comemora uma vez", () => {
    renderHook(() => useCelebrateOnce("aprovada-1"));
    expect(renderHook(() => useCelebrateOnce("aprovada-2")).result.current).toBe(true);
  });

  it("REQ-HVER-016 sem id não comemora", () => {
    expect(renderHook(() => useCelebrateOnce(null)).result.current).toBe(false);
  });

  it("REQ-HVER-016 sem storage, comemora uma vez por sessão", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(renderHook(() => useCelebrateOnce("sem-storage")).result.current).toBe(true);
    expect(renderHook(() => useCelebrateOnce("sem-storage")).result.current).toBe(false);
  });
});
