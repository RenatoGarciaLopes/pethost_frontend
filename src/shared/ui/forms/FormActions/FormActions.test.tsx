import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { FormActions } from "./FormActions";
it("REQ-DS-014 barra comunica destino e voltar chama callback", async () => {
  const back = vi.fn(),
    next = vi.fn();
  const { user } = renderWithProviders(
    <FormActions backLabel="Voltar" nextLabel="Continuar: saúde" onBack={back} onNext={next} />,
  );
  await user.click(screen.getByRole("button", { name: "Voltar" }));
  expect(back).toHaveBeenCalledOnce();
  await user.click(screen.getByRole("button", { name: "Continuar: saúde" }));
  expect(next).toHaveBeenCalledOnce();
});
it("REQ-DS-014 ação desabilitada mostra motivo e impede avanço", async () => {
  const next = vi.fn();
  renderWithProviders(
    <FormActions
      backLabel="Voltar"
      nextLabel="Continuar"
      onBack={() => {}}
      onNext={next}
      disabledReason="Falta preencher o nome"
    />,
  );
  expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Continuar" })).toHaveAccessibleDescription("Falta preencher o nome");
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(next).not.toHaveBeenCalled();
});
it("REQ-DS-014 envio em andamento trava o avanço e marca aria-busy", () => {
  renderWithProviders(
    <FormActions backLabel="Voltar" nextLabel="Criando sua conta…" onBack={() => {}} nextType="submit" busy />,
  );
  const next = screen.getByRole("button", { name: "Criando sua conta…" });
  expect(next).toBeDisabled();
  expect(next).toHaveAttribute("aria-busy", "true");
  expect(next).toHaveAttribute("type", "submit");
});
