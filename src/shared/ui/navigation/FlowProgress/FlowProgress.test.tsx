import { screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { FlowProgress } from "./FlowProgress";

const steps = [
  { id: "account", label: "Conta", description: "Seus dados de acesso" },
  { id: "pet", label: "Corpo", description: "Conte sobre o pet" },
  { id: "photos", label: "Fotos", description: "Escolha as imagens" },
];
afterEach(() => vi.unstubAllGlobals());

it("REQ-UIC-005 shows desktop descriptions and current step semantics", () => {
  renderWithProviders(<FlowProgress steps={steps} current="pet" completed={["account"]} />, { theme: quintalTheme });
  const nav = screen.getByRole("navigation", { name: "Etapas do cadastro" });
  expect(within(nav).getByText("Conte sobre o pet")).toBeInTheDocument();
  expect(within(nav).getByRole("listitem", { current: "step" })).toHaveTextContent("Corpo");
  expect(within(nav).getAllByRole("listitem")).toHaveLength(3);
});

it("REQ-UIC-006 shows mobile ring, next label, and screen-reader step count", () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  renderWithProviders(<FlowProgress steps={steps} current="pet" completed={["account"]} />, { theme: quintalTheme });
  const nav = screen.getByRole("navigation", { name: "Etapas do cadastro" });
  expect(within(nav).getByText("2/3")).toBeInTheDocument();
  expect(within(nav).getByText("Próximo: Fotos")).toBeInTheDocument();
  expect(within(nav).getByText(/Passo 2 de 3 · Corpo/)).toBeInTheDocument();
});

it("REQ-UIC-005 handles an empty flow without dividing by zero", () => {
  const { container } = renderWithProviders(<FlowProgress steps={[]} current="missing" />, { theme: quintalTheme });
  expect(container).toBeEmptyDOMElement();
});
