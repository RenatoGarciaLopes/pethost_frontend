import { act, fireEvent, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { usePointerParallax } from "./usePointerParallax";

afterEach(() => vi.unstubAllGlobals());
it("REQ-AUTH-021 mouse fino move camadas e desativar retorna ao centro", async () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true })),
  );
  const { result, rerender } = renderHook(({ enabled }) => usePointerParallax(enabled), {
    initialProps: { enabled: true },
  });
  act(() => {
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: window.innerWidth, clientY: 0 }));
  });
  await waitFor(() => expect(result.current.x.get()).toBeCloseTo(1, 1), { timeout: 3000 });
  await waitFor(() => expect(result.current.y.get()).toBeCloseTo(-1, 1));
  rerender({ enabled: false });
  await waitFor(() => expect(result.current.x.get()).toBeCloseTo(0, 1), { timeout: 3000 });
  await waitFor(() => expect(result.current.y.get()).toBeCloseTo(0, 1));
});
it.each([true, false])("REQ-AUTH-021 sem ponteiro fino ou desativado mantém centro: enabled=%s", (enabled) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
  const { result } = renderHook(() => usePointerParallax(enabled));
  fireEvent(window, new MouseEvent("pointermove", { clientX: 900, clientY: 500 }));
  expect(result.current.x.get()).toBe(0);
  expect(result.current.y.get()).toBe(0);
});
