import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { quintalTheme } from "../../../theme/createQuintalTheme";
import { ChoiceCard } from "./ChoiceCard";
it("REQ-DS-009 card selecionado mostra check além da cor", () => {
  renderWithProviders(<ChoiceCard label="Casa" value="house" checked icon={<span>⌂</span>} />, { theme: quintalTheme });
  expect(screen.getByRole("radio", { name: "Casa" })).toBeChecked();
  expect(getComputedStyle(screen.getByRole("radio", { name: "Casa" }).closest("label")!).borderRadius).toBe("24px");
  expect(screen.getByText("✓")).toHaveAttribute("aria-hidden", "true");
});
it("REQ-DS-009 card não selecionado não mostra check", () => {
  renderWithProviders(<ChoiceCard label="Casa" value="house" checked={false} />);
  expect(screen.getByRole("radio", { name: "Casa" })).not.toBeChecked();
  expect(screen.queryByText("✓")).not.toBeInTheDocument();
});
it("REQ-DS-009 label não cria botão interativo envolvendo o radio", () => {
  renderWithProviders(<ChoiceCard label="Casa" value="house" />);
  expect(screen.getByRole("radio", { name: "Casa" }).closest("label")).not.toHaveAttribute("role");
});
it("REQ-DS-009 como checkbox avisa o novo estado e mantém o nome com a descrição", async () => {
  const change = vi.fn();
  const { user } = renderWithProviders(
    <ChoiceCard control="checkbox" label="Pequeno" description="até 10 kg" value="small" onCheckedChange={change} />,
  );
  await user.click(screen.getByRole("checkbox", { name: "Pequeno. até 10 kg" }));
  expect(change).toHaveBeenCalledWith(true);
});
