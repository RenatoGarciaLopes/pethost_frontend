import { act, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/render";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

function Probe() {
  return <output>{String(usePrefersReducedMotion())}</output>;
}
it("REQ-DS-008 acompanha preferências e remove o listener ao desmontar", () => {
  let listener: (event: MediaQueryListEvent) => void = () => {};
  const remove = vi.fn();
  const query = {
    matches: true,
    addEventListener: (_: string, handler: typeof listener) => {
      listener = handler;
    },
    removeEventListener: remove,
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => query),
  );
  const { unmount } = renderWithProviders(<Probe />);
  expect(screen.getByRole("status")).toHaveTextContent("true");
  act(() => {
    query.matches = false;
    listener({ matches: false } as MediaQueryListEvent);
  });
  expect(screen.getByRole("status")).toHaveTextContent("false");
  unmount();
  expect(remove).toHaveBeenCalled();
  vi.unstubAllGlobals();
});
it("REQ-DS-008 sem matchMedia mantém funcionamento sem animação", () => {
  vi.stubGlobal("matchMedia", undefined);
  renderWithProviders(<Probe />);
  expect(screen.getByRole("status")).toHaveTextContent("true");
  vi.unstubAllGlobals();
});
