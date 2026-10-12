import { screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { WizardProgress } from "./WizardProgress";

const steps = [
  { id: "you", label: "Você" },
  { id: "address", label: "Endereço" },
  { id: "done", label: "Confirmar" },
];
afterEach(() => vi.unstubAllGlobals());
it("REQ-DS-012 trilha descreve concluído, atual e futuro sem navegar", () => {
  const { rerender } = renderWithProviders(<WizardProgress steps={steps} currentIndex={1} variant="trail" />, {
    theme: quintalTheme,
  });
  const items = within(screen.getByRole("navigation", { name: "Etapas" })).getAllByRole("listitem");
  expect(items[0]).toHaveTextContent("Você (concluído)");
  expect(items[1]).toHaveTextContent("Endereço (passo atual)");
  expect(items[1]).toHaveAttribute("aria-current", "step");
  expect(items[2]).toHaveTextContent("Confirmar (a fazer)");
  expect(items[2]).not.toHaveAttribute("aria-current");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  rerender(<WizardProgress steps={steps} currentIndex={2} variant="trail" label="Cadastro" />);
  expect(screen.getByRole("navigation", { name: "Cadastro" }).querySelector('[aria-current="step"]')).toHaveTextContent(
    "Confirmar",
  );
});
it("REQ-DS-012 anel anuncia posição e próximo passo, final omite próximo", () => {
  const { rerender } = renderWithProviders(<WizardProgress steps={steps} currentIndex={0} variant="ring" />, {
    theme: quintalTheme,
  });
  expect(screen.getByText(/Passo 1 de 3/).parentElement).toHaveTextContent("Você");
  expect(screen.getByText("Próximo: Endereço")).toBeVisible();
  rerender(<WizardProgress steps={steps} currentIndex={2} variant="ring" />);
  expect(screen.getByText(/Passo 3 de 3/).parentElement).toHaveTextContent("Confirmar");
  expect(screen.queryByText(/Próximo:/)).not.toBeInTheDocument();
});
it.each([true, false])("REQ-DS-012 auto escolhe formato pela largura: estreito=%s", (narrow) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: narrow, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  renderWithProviders(<WizardProgress steps={steps} currentIndex={0} />, { theme: quintalTheme });
  if (narrow) expect(screen.getByText("Próximo: Endereço")).toBeVisible();
  else expect(screen.getAllByRole("listitem")).toHaveLength(3);
});
