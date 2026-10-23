import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { GrassFooter } from "./GrassFooter";

function stubMotion(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Posiciona o rodapé (altura 344) com o topo em `top` px numa janela de 800 px. */
function placeFooter(top: number) {
  vi.stubGlobal("innerHeight", 800);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top, height: 344 } as DOMRect);
}
function scrollFrame() {
  window.dispatchEvent(new Event("scroll"));
  act(() => vi.advanceTimersToNextFrame());
}

beforeEach(() => vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] }));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("REQ-UIC-011 é só desenho: escondido da leitura de tela e sem landmark", () => {
  stubMotion(false);
  placeFooter(900);
  renderWithProviders(<GrassFooter />, { theme: quintalTheme });
  const footer = screen.getByTestId("grass-footer");
  expect(footer).toHaveAttribute("aria-hidden", "true");
  expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
});

it("REQ-UIC-011 a terra escurece conforme o rodapé sobe na tela e volta ao subir", () => {
  stubMotion(false);
  placeFooter(900);
  renderWithProviders(<GrassFooter />, { theme: quintalTheme });
  const footer = screen.getByTestId("grass-footer");
  expect(footer.style.getPropertyValue("--descida")).toBe("0.000");
  placeFooter(628);
  scrollFrame();
  expect(footer.style.getPropertyValue("--descida")).toBe("0.500");
  placeFooter(456);
  scrollFrame();
  expect(footer.style.getPropertyValue("--descida")).toBe("1.000");
  placeFooter(1200);
  scrollFrame();
  expect(footer.style.getPropertyValue("--descida")).toBe("0.000");
});

it("REQ-UIC-011 com movimento reduzido não ouve a rolagem e fica no degradê estático", () => {
  stubMotion(true);
  placeFooter(456);
  renderWithProviders(<GrassFooter />, { theme: quintalTheme });
  const footer = screen.getByTestId("grass-footer");
  scrollFrame();
  expect(footer.style.getPropertyValue("--descida")).toBe("");
});
