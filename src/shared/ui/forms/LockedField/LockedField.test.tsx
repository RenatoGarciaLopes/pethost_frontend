import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { LockedField } from "./LockedField";
it("REQ-DS-014 campo travado mantém leitura, motivo e impede edição", async () => {
  const { user } = renderWithProviders(<LockedField label="Documento" value="123" reason="Confirmado anteriormente" />);
  const input = screen.getByRole("textbox", { name: "Documento" });
  expect(input).toHaveAttribute("readonly");
  expect(input).toHaveAccessibleDescription("Confirmado anteriormente");
  await user.type(input, "456");
  expect(input).toHaveValue("123");
  expect(screen.getByText("🔒")).toHaveAttribute("aria-hidden", "true");
});
it("REQ-DS-014 preserva adornos de slots mantendo read-only obrigatório", () => {
  const { rerender } = renderWithProviders(
    <LockedField
      label="Documento"
      value="123"
      reason="Confirmado"
      slotProps={{ input: { readOnly: false, startAdornment: <span>Prefixo</span> } }}
    />,
  );
  expect(screen.getByText("Prefixo")).toBeVisible();
  expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
  rerender(
    <LockedField
      label="Documento"
      value="123"
      reason="Confirmado"
      slotProps={{ input: () => ({ startAdornment: <span>Outro prefixo</span> }) }}
    />,
  );
  expect(screen.getByText("Outro prefixo")).toBeVisible();
});

it("REQ-ACC-013 adorno final de objeto ou callback permanece operável com o cadeado", async () => {
  const { user, rerender } = renderWithProviders(
    <LockedField
      label="CPF"
      value="123"
      reason="Conferido"
      slotProps={{ input: { endAdornment: <button type="button">Esconder</button> } }}
    />,
  );
  expect(screen.getByRole("button", { name: "Esconder" })).toBeVisible();
  await user.tab();
  await user.tab();
  expect(screen.getByRole("button", { name: "Esconder" })).toHaveFocus();
  expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
  expect(screen.getByText("🔒")).toHaveAttribute("aria-hidden", "true");
  rerender(
    <LockedField
      label="CPF"
      value="123"
      reason="Conferido"
      slotProps={{ input: () => ({ endAdornment: <button type="button">Mostrar</button>, readOnly: false }) }}
    />,
  );
  expect(screen.getByRole("button", { name: "Mostrar" })).toBeVisible();
  expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
});
