import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { DoorScene } from "./DoorScene";

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("pointer: fine"),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => vi.unstubAllGlobals());

function parts(container: HTMLElement) {
  const svg = container.querySelector("svg")!;
  const leaf = svg.querySelector('path[d="M50 104V46A20 40 0 0 1 90 46V104Z"]')!.parentElement!.parentElement!;
  const door = leaf.parentElement!;
  const ground = svg.querySelector('path[d^="M0 228"][fill]:not([fill="none"])')!;
  return { svg, leaf, door, ground };
}
it("REQ-AUTH-016/021 foco e hover no formulário abrem porta e aquecem luz", async () => {
  const { user, container } = renderWithProviders(
    <>
      <DoorScene />
      <form data-door-target="">
        <input aria-label="Email" />
        <button type="button" data-door-warm="">
          Entrar
        </button>
      </form>
      <button>Fora</button>
    </>,
    { theme: quintalTheme },
  );
  const { svg, leaf } = parts(container);
  expect(svg).toHaveAttribute("focusable", "false");
  expect(svg.parentElement).toHaveAttribute("aria-hidden", "true");
  await waitFor(() => expect(leaf.style.transform).toBe("none"), { timeout: 3000 });
  await user.click(screen.getByLabelText("Email"));
  await waitFor(() => expect(leaf.style.transform).toContain("scaleX(0.55)"), { timeout: 3000 });
  fireEvent.pointerOver(screen.getByRole("button", { name: "Entrar" }));
  await waitFor(() => expect(leaf.style.transform).toContain("scaleX(0.32)"), { timeout: 3000 });
  const event = new Event("pointerdown", { bubbles: true, cancelable: true });
  fireEvent(svg, event);
  expect(event.defaultPrevented).toBe(true);
  expect(screen.getByLabelText("Email")).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Fora" }));
  fireEvent.pointerOut(svg, { relatedTarget: null });
  await waitFor(() => expect(leaf.style.transform).toBe("none"), { timeout: 3000 });
}, 15000);
it.each(["closed", "open", "wide"] as const)("REQ-AUTH-016 estado fixo %s ignora formulário", async (state) => {
  const { container } = renderWithProviders(
    <>
      <DoorScene state={state} />
      <button data-door-target="" data-door-warm="">
        Entrar
      </button>
    </>,
    { theme: quintalTheme },
  );
  const { leaf } = parts(container);
  fireEvent.pointerOver(screen.getByText("Entrar"));
  const expected = state === "closed" ? "none" : `scaleX(${state === "open" ? 0.55 : 0.32})`;
  await waitFor(() => expect(leaf.style.transform).toBe(expected), { timeout: 3000 });
});
it.each(["porta", "capacho"])(
  "REQ-AUTH-021 clique no elemento %s abre e retorna",
  async (target) => {
    const { container } = renderWithProviders(<DoorScene />, { theme: quintalTheme });
    const { svg, leaf, door } = parts(container);
    await waitFor(() => expect(leaf.style.transform).toBe("none"), { timeout: 3000 });
    const cloud = svg.querySelector('path[d^="M8 34"]') as SVGElement;
    await waitFor(() => expect(cloud.style.transform).toContain("translateX"), { timeout: 3000 });
    const scales: number[] = [];
    // Guarda também os quadros transitórios: a porta pode voltar antes da próxima consulta.
    const observer = new MutationObserver((records) => {
      for (const style of [...records.map((record) => record.oldValue), leaf.getAttribute("style")]) {
        const scale = style?.match(/scaleX\(([^)]+)\)/)?.[1];
        if (scale) scales.push(Number(scale));
      }
    });
    observer.observe(leaf, { attributes: true, attributeFilter: ["style"], attributeOldValue: true });
    try {
      fireEvent.click(target === "porta" ? door : svg.querySelector('rect[x="138"]')!);
      await waitFor(() => expect(scales.some((scale) => scale < 0.4)).toBe(true), { timeout: 4000 });
      await waitFor(() => expect(leaf.style.transform).toBe("none"), { timeout: 4000 });
    } finally {
      observer.disconnect();
    }
  },
  15000,
);
it("REQ-AUTH-021 planta até seis flores, limita altura e descarta a mais antiga", async () => {
  const { container } = renderWithProviders(<DoorScene />, { theme: quintalTheme });
  const { svg, ground } = parts(container);
  Object.defineProperty(svg, "getScreenCTM", { value: () => ({ inverse: () => ({}) }) });
  vi.stubGlobal(
    "DOMPoint",
    class {
      constructor(
        public x: number,
        public y: number,
      ) {}
      matrixTransform() {
        return this;
      }
    },
  );
  for (let index = 0; index < 7; index++)
    fireEvent.click(ground, { clientX: 30 + index * 20, clientY: index === 0 ? 0 : 400 });
  await waitFor(() => expect(svg.querySelectorAll('g[transform^="translate("][transform$="292)"]')).toHaveLength(6), {
    timeout: 3000,
  });
  await waitFor(() => expect(svg.querySelector('g[transform="translate(30 238)"]')).not.toBeInTheDocument(), {
    timeout: 3000,
  });
  expect(svg.querySelector('g[transform="translate(150 292)"]')).toBeInTheDocument();
});
it("REQ-AUTH-021 sem matriz SVG não planta e movimento reduzido mantém pólen estático", async () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  const { container } = renderWithProviders(<DoorScene />, { theme: quintalTheme });
  const { svg, ground } = parts(container);
  Object.defineProperty(svg, "getScreenCTM", { value: () => null });
  fireEvent.click(ground, { clientX: 80, clientY: 280 });
  expect(svg.querySelectorAll('g[transform^="translate("]').length).toBe(6);
  const pollen = svg.querySelector('circle[cx="92"]')!;
  await waitFor(() => expect(pollen).toHaveStyle({ opacity: "1" }));
  expect(pollen.getAttribute("transform")).toBeNull();
});
