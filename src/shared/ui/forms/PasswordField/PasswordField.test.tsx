import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { PasswordField } from "./PasswordField";
it("REQ-DS-011 alterna senha, aria-pressed e mantém foco no campo", async () => {
  const { user } = renderWithProviders(<PasswordField label="Senha" defaultValue="Segredo1!" />);
  const input = screen.getByLabelText("Senha");
  expect(input).toHaveAttribute("type", "password");
  const show = screen.getByRole("button", { name: "Mostrar" });
  expect(show).toHaveAttribute("aria-pressed", "false");
  await user.click(input);
  await user.click(show);
  expect(input).toHaveAttribute("type", "text");
  expect(input).toHaveFocus();
  expect(screen.getByRole("button", { name: "Esconder" })).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByRole("button", { name: "Esconder" }));
  expect(input).toHaveAttribute("type", "password");
  expect(input).toHaveFocus();
});
it("REQ-DS-011 botão funciona pelo teclado e preserva slots e rótulos recebidos", async () => {
  const { user, rerender } = renderWithProviders(
    <PasswordField
      label="Senha"
      showLabel="Revelar"
      hideLabel="Ocultar"
      slotProps={{ input: { startAdornment: <span>Chave</span> } }}
    />,
  );
  expect(screen.getByText("Chave")).toBeVisible();
  await user.tab();
  await user.tab();
  await user.keyboard("{Enter}");
  expect(screen.getByLabelText("Senha")).toHaveFocus();
  expect(screen.getByRole("button", { name: "Ocultar" })).toHaveAttribute("aria-pressed", "true");
  rerender(<PasswordField label="Senha" slotProps={{ input: () => ({ startAdornment: <span>Prefixo</span> }) }} />);
  expect(screen.getByText("Prefixo")).toBeVisible();
});
it("REQ-DS-011 campo desabilitado desabilita alternância", () => {
  renderWithProviders(<PasswordField label="Senha" disabled />);
  expect(screen.getByRole("button", { name: "Mostrar" })).toBeDisabled();
});
