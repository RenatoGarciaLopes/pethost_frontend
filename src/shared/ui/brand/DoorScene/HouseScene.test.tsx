import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { DoorScene } from "./DoorScene";

afterEach(() => vi.unstubAllGlobals());

it("REQ-UIC-009 casa abre no hover sem tirar o foco da busca", async () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("pointer: fine"),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  const { container, user } = renderWithProviders(
    <>
      <DoorScene variant="house" />
      <input aria-label="Onde" />
    </>,
    { theme: quintalTheme },
  );
  await user.click(screen.getByRole("textbox", { name: "Onde" }));
  const house = container.querySelector("[data-house]")!;
  const leaf = container.querySelector("[data-house-leaf]") as SVGGElement;
  expect(house).not.toBeNull();
  fireEvent.pointerOver(house);
  await waitFor(() => expect(leaf.style.transform).toContain("scaleX(0.6)"), { timeout: 3000 });
  fireEvent.pointerDown(house);
  expect(screen.getByRole("textbox", { name: "Onde" })).toHaveFocus();
  fireEvent.pointerOut(house);
  await waitFor(() => expect(leaf.style.transform).toBe("none"), { timeout: 3000 });
});

it("REQ-UIC-009 movimento reduzido deixa dois cães parados, sem travessia", () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  const { container } = renderWithProviders(<DoorScene variant="house" />, { theme: quintalTheme });
  expect(container.querySelectorAll("canvas")).toHaveLength(2);
  expect(container.querySelector("img")).not.toBeInTheDocument();
  expect(container.querySelector("svg")).toHaveAttribute("focusable", "false");
});
