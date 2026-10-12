import { act } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TurmaWalker } from "./TurmaWalker";
import { TurmaDog } from "./TurmaDog";

afterEach(() => {
  vi.unstubAllGlobals();
});
it.each(["loop", "once"] as const)(
  "REQ-DS-016 desfile %s respeita membros, dimensões e não bloqueia interação",
  (repeat) => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    const { container } = renderWithProviders(
      <TurmaWalker members={["corgi", "golden"]} dogHeight={40} crossingMs={1000} intervalMs={2000} repeat={repeat} />,
    );
    const track = container.querySelector('[aria-hidden="true"]')!;
    expect(track).toHaveStyle({ height: "40px", pointerEvents: "none" });
    const dogs = container.querySelectorAll("img");
    expect(dogs).toHaveLength(2);
    expect(dogs[0]).toHaveAttribute("height", "40");
    expect(dogs[0]).toHaveAttribute("alt", "");
    expect(dogs[0].parentElement).toHaveStyle({ visibility: "hidden" });
    expect(getComputedStyle(dogs[0].parentElement!).animation).toContain(repeat === "loop" ? "infinite" : "1 both");
  },
);
it("REQ-DS-008 movimento reduzido usa canvas e desenha primeiro quadro", () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  const images: { onload: (() => void) | null; src: string }[] = [];
  vi.stubGlobal(
    "Image",
    class {
      onload: (() => void) | null = null;
      src = "";
      constructor() {
        images.push(this);
      }
    },
  );
  const context = { clearRect: vi.fn(), drawImage: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  const { container, unmount } = renderWithProviders(<TurmaWalker />);
  expect(container.querySelectorAll("canvas")).toHaveLength(3);
  expect(container.querySelector("img")).not.toBeInTheDocument();
  const canvas = container.querySelector("canvas")!;
  expect(canvas).toHaveAttribute("height", "84");
  act(() => {
    images[0].onload?.();
  });
  expect(context.drawImage).toHaveBeenCalledWith(images[0], 0, 0, Number(canvas.width), 84);
  expect(context.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, 84);
  expect(canvas.parentElement).not.toHaveStyle({ visibility: "hidden" });
  unmount();
  expect(images.every((image) => image.onload === null)).toBe(true);
});
it("REQ-DS-008 still explícito permite imagem animada ou quadro estático", () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  vi.stubGlobal(
    "Image",
    class {
      onload = null;
      src = "";
    },
  );
  const { container, rerender } = renderWithProviders(<TurmaDog member="pastor" height={50} still={false} />);
  expect(container.querySelector("img")).toHaveAttribute("height", "50");
  rerender(<TurmaDog member="pastor" height={50} still />);
  expect(container.querySelector("canvas")).toHaveAttribute("height", "50");
  expect(container.querySelector("img")).not.toBeInTheDocument();
});
