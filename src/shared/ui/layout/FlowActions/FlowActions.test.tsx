import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { FlowActions } from "./FlowActions";

it("REQ-UIC-005 exposes back and primary actions with useful names", async () => {
  const onBack = vi.fn();
  const onContinue = vi.fn();
  const { user } = renderWithProviders(<FlowActions onBack={onBack} onContinue={onContinue} />);
  await user.click(screen.getByRole("button", { name: "Voltar" }));
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  expect(onBack).toHaveBeenCalledOnce();
  expect(onContinue).toHaveBeenCalledOnce();
});

it("REQ-UIC-005 supports the first step and disabled primary state", () => {
  renderWithProviders(<FlowActions onContinue={() => undefined} continueDisabled />);
  expect(screen.queryByRole("button", { name: "Voltar" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  expect(document.head.textContent).toContain("safe-area-inset-bottom");
});
