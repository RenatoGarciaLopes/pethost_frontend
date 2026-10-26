import { screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import Loading from "./loading";
afterEach(() => vi.unstubAllGlobals());
it.each([false, true])("REQ-SHELL-012 carregamento anuncia Farejando com movimento reduzido %s", (reduced) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  const { container } = renderWithProviders(<Loading />, { theme: quintalTheme });
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.getByRole("status")).toHaveTextContent("Farejando");
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(container.querySelectorAll("img")).toHaveLength(3);
  for (const dog of container.querySelectorAll("img")) expect(dog.src).toMatch(/^data:image\/webp;base64,/);
  if (reduced) {
    const rules = Array.from(document.styleSheets)
      .flatMap((sheet) => Array.from(sheet.cssRules))
      .map((rule) => rule.cssText)
      .join(" ");
    expect(rules).toMatch(/prefers-reduced-motion: ?reduce/);
    expect(rules).toMatch(/animation: ?none !important/);
  }
});
