import { fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { DoorMark } from "./DoorMark";
import { GroundLine } from "./GroundLine";
import { PawMark } from "./PawMark";
import { Daisy } from "./Daisy";
import { SniffLoader } from "./SniffLoader";
import { Celebration } from "./Celebration";

afterEach(() => vi.unstubAllGlobals());
it("REQ-DS-015 DoorMark nomeia marca quando informativo e respeita escala", () => {
  const { container, rerender } = renderWithProviders(<DoorMark />, { theme: quintalTheme });
  expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelector("svg")).toHaveAttribute("width", "40");
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  rerender(<DoorMark title="PetHost" size="large" withWordmark interactive={false} />);
  expect(screen.getByRole("img", { name: "PetHost" })).toHaveAttribute("width", "170");
  expect(screen.getByText("pethost")).toBeVisible();
  expect(container.querySelector("path")).toHaveAttribute("stroke-width", "6");
  rerender(<DoorMark title="Marca" width={100} />);
  expect(screen.getByRole("img", { name: "Marca" })).toHaveAttribute("height", "110");
  expect(screen.queryByText("pethost")).not.toBeInTheDocument();
});
it("GroundLine mantém traço ao esticar e permite faixa sem tufos", () => {
  const { container, rerender } = renderWithProviders(<GroundLine />, { theme: quintalTheme });
  expect(container.querySelector("svg")).toHaveAttribute("preserveAspectRatio", "none");
  expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelectorAll("path")).toHaveLength(6);
  expect(container.querySelector("path")).toHaveAttribute("vector-effect", "non-scaling-stroke");
  rerender(<GroundLine tufts={false} height={40} />);
  expect(container.querySelectorAll("path")).toHaveLength(1);
  expect(container.querySelector("svg")).toHaveStyle({ height: "40px" });
});
it.each(["branco", "ceu", "coral"] as const)("Daisy preserva proporção e cor %s e pode ficar parada", (petal) => {
  const { container, rerender } = renderWithProviders(<Daisy petal={petal} size={32} sway={false} />, {
    theme: quintalTheme,
  });
  const svg = container.querySelector("svg")!;
  expect(svg).toHaveStyle({ height: "32px", width: "20px" });
  expect(svg).toHaveAttribute("focusable", "false");
  expect(svg.querySelectorAll("ellipse")).toHaveLength(8);
  const expected =
    petal === "ceu"
      ? quintalTheme.palette.ceu.main
      : petal === "coral"
        ? quintalTheme.palette.quintal.coral
        : quintalTheme.palette.background.paper;
  expect(svg.querySelector("ellipse")).toHaveAttribute("fill", expected);
  expect(svg.querySelector("g")).toHaveStyle({ animation: "none" });
  rerender(<Daisy />);
  expect(container.querySelector("svg")).toHaveStyle({ height: "64px" });
});
it("SniffLoader anuncia somente rótulo e permite personalizar escala", () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  const { container, rerender } = renderWithProviders(<SniffLoader />, { theme: quintalTheme });
  expect(screen.getByRole("status")).toHaveTextContent("Farejando");
  expect(container.querySelectorAll("img")).toHaveLength(3);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  rerender(<SniffLoader label="Procurando cantinhos" scale={1} />);
  expect(screen.getByRole("status")).toHaveTextContent("Procurando cantinhos");
  expect(screen.queryByText("Farejando")).not.toBeInTheDocument();
  expect(container.querySelector('svg[viewBox="0 0 100 110"]')).toHaveAttribute("width", "60");
});
it("REQ-DS-016 Celebration preserva interação e informa término uma vez", async () => {
  const done = vi.fn();
  const click = vi.fn();
  const { container, user, rerender } = renderWithProviders(
    <Celebration onDone={done}>
      <button onClick={click}>Continuar</button>
    </Celebration>,
    { theme: quintalTheme },
  );
  await user.click(screen.getByRole("button"));
  expect(click).toHaveBeenCalledOnce();
  const sparks = container.querySelector('[aria-hidden="true"]')!;
  expect(sparks).toHaveStyle({ pointerEvents: "none" });
  fireEvent.animationEnd(sparks.firstElementChild!);
  expect(done).not.toHaveBeenCalled();
  fireEvent.animationEnd(sparks.lastElementChild!);
  fireEvent(sparks.lastElementChild!, new Event("webkitAnimationEnd", { bubbles: true }));
  expect(done).toHaveBeenCalledOnce();
  rerender(
    <Celebration playKey="novo">
      <span>Concluído</span>
    </Celebration>,
  );
  expect(screen.getByText("Concluído")).toBeVisible();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(container.querySelector('[aria-hidden="true"]')).not.toBe(sparks);
});

it("REQ-PETS-001 PawMark é decorativa e segue o tamanho pedido", () => {
  const { container } = renderWithProviders(<PawMark size={40} />);
  const svg = container.querySelector("svg")!;
  expect(svg).toHaveAttribute("aria-hidden", "true");
  expect(svg).toHaveAttribute("width", "40");
  expect(svg).toHaveAttribute("fill", "currentColor");
});
