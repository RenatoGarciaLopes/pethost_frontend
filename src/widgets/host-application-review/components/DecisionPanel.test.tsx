import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DecisionPanel } from "./DecisionPanel";
import { adminReviewCopy as copy } from "@/features/admin-host-applications";

// Checklist inteiro e motivo digitado: com a suíte em paralelo, 5 s não bastam.
vi.setConfig({ testTimeout: 20_000 });
it("REQ-AQUEUE-008/009 aprovação exige checklist inteiro e motivo", async () => {
  const decide = vi.fn();
  const { user } = renderWithProviders(<DecisionPanel personType="pj" onDecide={decide} busy={false} />);
  const approve = screen.getByRole("button", { name: "Aprovar" });
  expect(approve).toBeDisabled();
  await user.click(screen.getByRole("textbox", { name: copy.reason }));
  await user.paste("Conferido");
  expect(approve).toBeDisabled();
  for (const name of [...copy.checklist, ...copy.companyChecklist])
    await user.click(screen.getByRole("checkbox", { name }));
  expect(screen.getByRole("link", { name: copy.registry })).toHaveAttribute("href", copy.registryUrl);
  await user.click(approve);
  expect(decide).toHaveBeenCalledWith({ reason: "Conferido" });
});
it("REQ-AQUEUE-010/011 recusa mostra frase e fraude exige confirmação separada", async () => {
  const decide = vi.fn();
  const { user } = renderWithProviders(<DecisionPanel personType="pf" onDecide={decide} busy={false} />);
  await user.click(screen.getByRole("textbox", { name: copy.reason }));
  await user.paste("Nota interna");
  await user.click(screen.getByRole("button", { name: "Documento ilegível" }));
  expect(screen.getByText(copy.recipient.document_illegible)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Recusar" }));
  expect(decide).toHaveBeenLastCalledWith({ reason: "Nota interna", rejectionReason: "document_illegible" });
  await user.click(screen.getByRole("button", { name: "Suspeita de fraude" }));
  expect(screen.getByRole("button", { name: "Confirmar recusa final" })).toBeDisabled();
  await user.click(screen.getByRole("checkbox", { name: copy.fraudConfirm }));
  await user.click(screen.getByRole("button", { name: "Confirmar recusa final" }));
  expect(decide).toHaveBeenLastCalledWith({ reason: "Nota interna", rejectionReason: "suspected_fraud" });
});
