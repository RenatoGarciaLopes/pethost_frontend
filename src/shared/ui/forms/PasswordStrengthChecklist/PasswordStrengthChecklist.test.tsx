import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { PasswordStrengthChecklist } from "./PasswordStrengthChecklist";
const labels = {
  length: "8 a 128 caracteres",
  uppercase: "Maiúscula",
  lowercase: "Minúscula",
  digit: "Número",
  special: "Símbolo",
};
it("REQ-DS-011 checklist anuncia cinco regras da API sem expor senha", () => {
  const { rerender } = renderWithProviders(<PasswordStrengthChecklist password="" labels={labels} />);
  const list = screen.getByRole("list", { name: "Requisitos da senha" });
  expect(list).toHaveAttribute("aria-live", "polite");
  // REQ-OREG-004: só o item que mudou é anunciado, não a lista inteira a cada tecla.
  expect(list).toHaveAttribute("aria-atomic", "false");
  expect(within(list).getAllByRole("listitem")).toHaveLength(5);
  expect(within(list).getAllByText(/Falta:/)).toHaveLength(5);
  rerender(<PasswordStrengthChecklist password="Abcdef1!" labels={labels} />);
  expect(within(list).getAllByText(/Atendido:/)).toHaveLength(5);
  expect(list).not.toHaveTextContent("Abcdef1!");
  rerender(<PasswordStrengthChecklist password={"A".repeat(129) + "á1 "} labels={labels} />);
  expect(screen.getByText("Falta: 8 a 128 caracteres")).toBeVisible();
  expect(screen.getByText("Falta: Símbolo")).toBeVisible();
  expect(screen.getByText("Atendido: Minúscula")).toBeVisible();
});
