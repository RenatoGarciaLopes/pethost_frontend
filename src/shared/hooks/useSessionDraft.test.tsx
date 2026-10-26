import { act, renderHook } from "@testing-library/react";
import { z } from "zod";
import { afterEach, beforeEach, expect, expectTypeOf, it, vi } from "vitest";
import { useSessionDraft } from "./useSessionDraft";
const schema = z.object({ name: z.string() });
const preprocessedSchema = z.object({
  name: z.preprocess((value) => (typeof value === "string" ? value.trim() : value), z.string()),
});
beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());
it("REQ-PNEW-021 schema com preprocess restaura e tipa os valores de saída", () => {
  sessionStorage.setItem("a", JSON.stringify({ name: " Mel " }));
  const { result } = renderHook(() => useSessionDraft("a", preprocessedSchema));
  expectTypeOf(result.current.draft).toEqualTypeOf<{ name: string } | null>();
  expect(result.current.draft).toEqual({ name: "Mel" });
});
it("REQ-PNEW-021 restaura válido, descarta inválido e não carrega outra conta", () => {
  sessionStorage.setItem("a", JSON.stringify({ name: "Mel", photos: ["extra"] }));
  const { result, rerender } = renderHook(({ key }) => useSessionDraft(key, schema), { initialProps: { key: "a" } });
  expect(result.current.draft).toEqual({ name: "Mel" });
  sessionStorage.setItem("b", "{quebrado");
  rerender({ key: "b" });
  expect(result.current.draft).toBeNull();
  expect(sessionStorage.getItem("b")).toBeNull();
  sessionStorage.setItem("c", JSON.stringify({ name: 1 }));
  rerender({ key: "c" });
  expect(result.current.draft).toBeNull();
  expect(sessionStorage.getItem("c")).toBeNull();
});
it("REQ-PNEW-021 debounce de 500 ms guarda só a última mudança e clear cancela", () => {
  const { result } = renderHook(() => useSessionDraft("a", schema));
  act(() => result.current.save({ name: "M" }));
  act(() => vi.advanceTimersByTime(499));
  expect(sessionStorage.getItem("a")).toBeNull();
  act(() => result.current.save({ name: "Mel" }));
  act(() => vi.advanceTimersByTime(499));
  expect(sessionStorage.getItem("a")).toBeNull();
  act(() => vi.advanceTimersByTime(1));
  expect(JSON.parse(sessionStorage.getItem("a")!)).toEqual({ name: "Mel" });
  act(() => {
    result.current.save({ name: "Outro" });
    result.current.clear();
    vi.advanceTimersByTime(500);
  });
  expect(result.current.draft).toBeNull();
  expect(sessionStorage.getItem("a")).toBeNull();
});
it("REQ-PNEW-021 trocar conta ou desmontar cancela escrita pendente", () => {
  const { result, rerender, unmount } = renderHook(({ key }) => useSessionDraft(key, schema), {
    initialProps: { key: "a" },
  });
  act(() => result.current.save({ name: "Mel" }));
  rerender({ key: "b" });
  act(() => vi.advanceTimersByTime(500));
  expect(sessionStorage.getItem("a")).toBeNull();
  act(() => result.current.save({ name: "Thor" }));
  unmount();
  act(() => vi.advanceTimersByTime(500));
  expect(sessionStorage.getItem("b")).toBeNull();
});
it("REQ-PNEW-021 acesso negado, escrita sem espaço e remoção negada não quebram", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("negado");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("cheio");
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
    throw new Error("negado");
  });
  const { result } = renderHook(() => useSessionDraft("a", schema));
  expect(result.current.draft).toBeNull();
  expect(() =>
    act(() => {
      result.current.save({ name: "Mel" });
      vi.advanceTimersByTime(500);
      result.current.clear();
    }),
  ).not.toThrow();
  expect(result.current.draft).toBeNull();
});
