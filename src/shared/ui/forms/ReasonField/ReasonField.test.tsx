import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ReasonField } from "./ReasonField";
it("REQ-AQUEUE-009/010 motivo mostra limite e erro acessível", async () => {
  const onChange = vi.fn();
  const { user } = renderWithProviders(
    <ReasonField label="Motivo" value="" onChange={onChange} helperText="Obrigatório" error="Escreva o motivo" />,
  );
  const input = screen.getByRole("textbox", { name: "Motivo" });
  expect(input).toHaveAttribute("aria-invalid", "true");
  await user.type(input, "A");
  expect(onChange).toHaveBeenCalledWith("A");
  expect(screen.getByText(/0\/500/)).toBeVisible();
});
