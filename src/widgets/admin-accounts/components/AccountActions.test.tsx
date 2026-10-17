import { fireEvent, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { adminOwnerFixture, adminHostFixture } from "@/test/fixtures/adminAccounts";
import { toAccountRow } from "../lib/accountRows";
import { AccountActions } from "./AccountActions";
it("REQ-AACC-007/008 ações liberam só conta suspensa e escondem retirada após liberação", async () => {
  const onAction = vi.fn();
  const row = toAccountRow({ kind: "owners", value: adminOwnerFixture({ suspendedAt: "2026-10-01T12:00:00Z" }) });
  const { user, rerender } = renderWithProviders(<AccountActions row={row} busy={false} onAction={onAction} />, {
    theme: quintalTheme,
  });
  await user.click(screen.getByRole("button", { name: "Liberar CPF" }));
  const dialog = screen.getByRole("dialog", { name: "Liberar CPF" });
  const reason = within(dialog).getByRole("textbox", { name: "Motivo" });
  fireEvent.change(reason, { target: { value: "Disputa conferida" } });
  expect(within(dialog).getByRole("button", { name: "Liberar CPF" })).toBeDisabled();
  const confirmation = within(dialog).getAllByRole("textbox")[1];
  fireEvent.change(confirmation, { target: { value: "LIBERAR" } });
  expect(within(dialog).getByRole("button", { name: "Liberar CPF" })).toBeEnabled();
  await user.click(within(dialog).getByRole("button", { name: "Liberar CPF" }));
  expect(onAction).toHaveBeenCalledWith({ action: "release", reason: "Disputa conferida" });
  rerender(<AccountActions row={{ ...row, status: "released" }} busy={false} onAction={onAction} />);
  expect(screen.queryByRole("button", { name: "Tirar suspensão" })).not.toBeInTheDocument();
});
it("REQ-AACC-015 reset aparece só no Stripe recusado e pede motivo e confirmação", async () => {
  const onAction = vi.fn();
  const row = toAccountRow({ kind: "hosts", value: adminHostFixture({ stripeStatus: "rejected" }) });
  const { user } = renderWithProviders(<AccountActions row={row} busy={false} onAction={onAction} />, {
    theme: quintalTheme,
  });
  await user.click(screen.getByRole("button", { name: "Dar nova chance no Stripe" }));
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveTextContent("Isso não libera repasses nem tira uma suspensão");
  const reason = within(dialog).getByRole("textbox", { name: "Motivo" });
  fireEvent.change(reason, { target: { value: "Dados corrigidos" } });
  expect(within(dialog).getByRole("textbox", { name: "Motivo" })).toHaveValue("Dados corrigidos");
  expect(within(dialog).getByRole("button", { name: "Dar nova chance no Stripe" })).toBeEnabled();
  await user.click(within(dialog).getByRole("button", { name: "Dar nova chance no Stripe" }));
  expect(onAction).toHaveBeenCalledWith({ action: "resetStripe", reason: "Dados corrigidos" });
});
