import { screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { WizardProgress } from "./WizardProgress";

const steps = [
  { id: "you", label: "Você" },
  { id: "address", label: "Endereço", description: "Pra achar cantinhos perto" },
  { id: "done", label: "Confirmar" },
];
afterEach(() => vi.unstubAllGlobals());
it("107 bloqueia a navegação durante a gravação", () => {
  const onSelect = vi.fn();
  renderWithProviders(
    <WizardProgress
      steps={steps}
      currentIndex={0}
      variant="trail"
      navigation={{ onSelect, menuLabel: "Seções", disabled: true }}
    />,
    { theme: quintalTheme },
  );
  const target = screen.getByRole("button", { name: "Confirmar" });
  expect(target).toBeDisabled();
  expect(onSelect).not.toHaveBeenCalled();
});
it("107 trilha navegável chama qualquer seção, com resumos e sem estados de cadastro", async () => {
  const onSelect = vi.fn();
  const { user } = renderWithProviders(
    <WizardProgress steps={steps} currentIndex={1} variant="trail" navigation={{ onSelect, menuLabel: "Seções" }} />,
    { theme: quintalTheme },
  );
  await user.click(screen.getByRole("button", { name: "Você" }));
  expect(onSelect).toHaveBeenCalledWith(0);
  expect(screen.getByRole("button", { name: /Endereço/ })).toHaveAttribute("aria-current", "step");
  expect(screen.queryByText(/concluído|a fazer/)).not.toBeInTheDocument();
});

it("107 anel abre lista e fecha ao escolher uma seção", async () => {
  const onSelect = vi.fn();
  const { user } = renderWithProviders(
    <WizardProgress steps={steps} currentIndex={0} variant="ring" navigation={{ onSelect, menuLabel: "Seções" }} />,
    { theme: quintalTheme },
  );
  await user.click(screen.getByRole("button", { name: "Seções" }));
  await user.click(await screen.findByRole("button", { name: "Confirmar" }));
  expect(onSelect).toHaveBeenCalledWith(2);
});
it("REQ-DS-012 trilha descreve concluído, atual e futuro sem navegar", () => {
  const { rerender } = renderWithProviders(
    <WizardProgress steps={steps} currentIndex={1} variant="trail" appearance="cards" />,
    {
      theme: quintalTheme,
    },
  );
  const items = within(screen.getByRole("navigation", { name: "Etapas" })).getAllByRole("listitem");
  expect(items[0]).toHaveTextContent("Você (concluído)");
  expect(items[1]).toHaveTextContent("Endereço (passo atual)");
  expect(items[1]).toHaveAttribute("aria-current", "step");
  expect(items[1]).toHaveTextContent("Pra achar cantinhos perto");
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
